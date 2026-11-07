-- One spin economy: spins from Log & Grow (spin_wallets) can be spent on the
-- weekly boss, alongside spins earned at the gym.
-- Run after 20261107000000_boss_battles.sql and 20261110000000_workout_log.sql.
-- If you ever re-run the boss battles migration on its own, re-run this one
-- after it: it replaces spins_available(), gym_check_in() and roll_spin().
--
-- Where spins come from:
--   * Gym check-ins (gym_sessions): 1 on check-in, +1 per 10 verified
--     minutes. Earned per week; unspent ones expire at week end.
--   * Log & Grow (spin_wallets.spins): 1 per exercise you beat. A balance
--     that carries over between weeks.
--
-- roll_spin() spends this week's gym spins first, then the wallet, and
-- records which one paid in boss_attacks.source. get_battle_state() reports
-- the total, so the hub, battle and log screens all show one number.

alter table public.boss_attacks
  add column if not exists source text not null default 'gym'
    check (source in ('gym', 'wallet'));

-- Gym spins earned this week minus the gym spins already spent on this
-- battle. Spins spent from the wallet don't count against gym spins.
create or replace function public.gym_spins_left(p_uid uuid, p_battle_id uuid, p_week date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select greatest(0,
    coalesce((
      select sum(s.bonus_spin::int + s.credited_seconds / 600)
      from public.gym_sessions s
      where s.user_id = p_uid
        and s.started_at >= p_week::timestamp at time zone 'utc'
        and s.started_at < (p_week + 7)::timestamp at time zone 'utc'
    ), 0)
    - (select count(*) from public.boss_attacks a
       where a.user_id = p_uid and a.battle_id = p_battle_id and a.source = 'gym')
  )::int
$$;

-- Everything the player can spend right now: gym spins plus the wallet.
create or replace function public.spins_available(p_uid uuid, p_battle_id uuid, p_week date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select public.gym_spins_left(p_uid, p_battle_id, p_week)
    + coalesce((select w.spins from public.spin_wallets w where w.user_id = p_uid), 0)
$$;

-- Same as in 20261107000000_boss_battles.sql, except that checking in while
-- a session is already active and the fix is away from the gym now raises
-- not_at_gym instead of silently ending the session and reporting success.
create or replace function public.gym_check_in(
  p_lat double precision, p_lng double precision, p_accuracy double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.expire_stale_session(v_uid);
  if exists (select 1 from public.gym_sessions where user_id = v_uid and ended_at is null) then
    -- Away from the gym? Say so. The session stays open and ends on the
    -- next heartbeat (or expires), as it would have anyway.
    perform public.assert_at_gym(v_uid, p_lat, p_lng, p_accuracy);
    perform public.gym_heartbeat(p_lat, p_lng, p_accuracy);
    return;
  end if;

  perform public.assert_at_gym(v_uid, p_lat, p_lng, p_accuracy);

  insert into public.gym_sessions (user_id, bonus_spin)
  values (
    v_uid,
    not exists (
      select 1 from public.gym_sessions
      where user_id = v_uid and started_at > now() - interval '6 hours'
    )
  );
exception when unique_violation then
  -- A concurrent check-in won the race; that session stands.
  null;
end;
$$;

-- Spends one spin: this week's gym spins first, then the wallet. Rolls a
-- rarity and damage, applies it to the boss and returns the roll. The
-- battle row lock serializes partners (and a player's own tabs) spinning
-- at once, and the wallet update only succeeds while spins > 0.
create or replace function public.roll_spin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_battle public.boss_battles;
  v_source text;
  v_roll int;
  v_rarity text;
  v_one int;
  v_ten int;
  v_thirty int;
  v_damage int;
  v_applied int;
  v_hp int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  v_battle := public.ensure_current_battle();
  select * into v_battle from public.boss_battles where id = v_battle.id for update;

  if v_battle.current_hp <= 0 then
    raise exception 'boss_defeated';
  end if;

  if public.gym_spins_left(v_uid, v_battle.id, v_battle.week_start) > 0 then
    v_source := 'gym';
  else
    update public.spin_wallets
    set spins = spins - 1, updated_at = now()
    where user_id = v_uid and spins > 0;
    if not found then
      raise exception 'no_spins';
    end if;
    v_source := 'wallet';
  end if;

  -- 0..9999, so one step is 0.01%.
  v_roll := floor(random() * 10000)::int;
  v_rarity := case
    when v_roll < 1 then 'legendary'      -- 0.01%
    when v_roll < 1001 then 'rare'        -- 10%
    when v_roll < 3001 then 'uncommon'    -- 20%
    else 'common'                         -- 69.99%
  end;

  v_one := greatest(1, floor(v_battle.max_hp * 0.01)::int);
  v_ten := greatest(v_one + 1, floor(v_battle.max_hp * 0.10)::int);
  v_thirty := greatest(v_ten + 1, floor(v_battle.max_hp * 0.30)::int);

  v_damage := case v_rarity
    when 'common' then 1 + floor(random() * v_one)::int
    when 'uncommon' then v_one + 1 + floor(random() * (v_ten - v_one))::int
    when 'rare' then v_ten + 1 + floor(random() * (v_thirty - v_ten))::int
    else greatest(1, floor(v_battle.max_hp * 0.5)::int)
  end;

  v_applied := least(v_damage, v_battle.current_hp);
  v_hp := v_battle.current_hp - v_applied;

  update public.boss_battles
  set current_hp = v_hp,
      defeated_at = case when v_hp = 0 then now() else null end
  where id = v_battle.id;

  insert into public.boss_attacks (battle_id, user_id, rarity, rolled_damage, damage, hp_after, source)
  values (v_battle.id, v_uid, v_rarity, v_damage, v_applied, v_hp, v_source);

  return jsonb_build_object(
    'rarity', v_rarity,
    'damage', v_damage,
    'appliedDamage', v_applied,
    'hpAfter', v_hp,
    'source', v_source
  );
end;
$$;

revoke all on function public.gym_spins_left(uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.spins_available(uuid, uuid, date) from public, anon, authenticated;

revoke all on function public.gym_check_in(double precision, double precision, double precision) from public, anon;
revoke all on function public.roll_spin() from public, anon;
grant execute on function public.gym_check_in(double precision, double precision, double precision) to authenticated;
grant execute on function public.roll_spin() to authenticated;
