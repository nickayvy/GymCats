-- Raises the floor of a common hit from 1 HP to 0.5% of the boss's max HP
-- (5-10 HP against a 1,000 HP boss, instead of 1-10).
-- Run after 20261112000000_unified_spins.sql. Only roll_spin() changes; it
-- is otherwise identical to the version in that migration.
-- Keep in sync with damageRange() in src/lib/battle/rules.ts.
--
-- Renumbered from 20261113000000, a version it shared with
-- free_gym_switching.sql: the database recorded that version as applied, so
-- this file was skipped and production kept the 1 HP floor.

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
  v_common_min int;
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
  v_common_min := least(v_one, greatest(1, floor(v_battle.max_hp * 0.005)::int));
  v_ten := greatest(v_one + 1, floor(v_battle.max_hp * 0.10)::int);
  v_thirty := greatest(v_ten + 1, floor(v_battle.max_hp * 0.30)::int);

  v_damage := case v_rarity
    when 'common' then v_common_min + floor(random() * (v_one - v_common_min + 1))::int
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

revoke all on function public.roll_spin() from public, anon;
grant execute on function public.roll_spin() to authenticated;
