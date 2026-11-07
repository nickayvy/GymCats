-- Boss battles: gym check-ins earn spins, spins roll damage against the
-- weekly boss. Every rule is enforced here, in security definer functions,
-- so a client can't hand itself spins or pick its own damage.
--
-- Keep these numbers in sync with src/lib/battle/rules.ts:
--   gym radius 150 m (+ up to 100 m of reported GPS accuracy)
--   fixes less accurate than 500 m are rejected
--   1 spin on check-in (at most once per 6 h), +1 per 10 verified minutes
--   gaps between pings are credited only up to 30 min, sessions cap at 3 h
--   a session with no ping for 3 h expires
--   rarities: common 69.99% (up to 1% of max HP), uncommon 20% (1-10%),
--             rare 10% (10-30%), legendary 0.01% (flat 50% of max HP)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.bosses (
  id text primary key,
  name text not null,
  max_hp int not null check (max_hp > 0),
  rotation_order int not null unique
);

-- Same roster and order as BOSS_ROSTER in src/lib/boss/currentBoss.ts.
insert into public.bosses (id, name, max_hp, rotation_order) values
  ('couch-kraken', 'The Couch Kraken', 1000, 0),
  ('snooze-lord', 'Lord Snoozealot', 1000, 1),
  ('donut-golem', 'The Donut Golem', 1000, 2)
on conflict (id) do update
  set name = excluded.name,
      max_hp = excluded.max_hp,
      rotation_order = excluded.rotation_order;

-- One home gym per user. Written only through set_my_gym().
create table if not exists public.user_gyms (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  set_at timestamptz not null default now()
);

create table if not exists public.gym_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  last_ping_at timestamptz not null default now(),
  ended_at timestamptz,
  bonus_spin boolean not null,
  credited_seconds int not null default 0
    check (credited_seconds between 0 and 10800)
);

create unique index if not exists gym_sessions_one_active
  on public.gym_sessions (user_id) where ended_at is null;
create index if not exists gym_sessions_user_started
  on public.gym_sessions (user_id, started_at desc);

-- party_id is the couple id, or the user id for players without a couple.
create table if not exists public.boss_battles (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null,
  week_start date not null,
  boss_id text not null references public.bosses (id),
  max_hp int not null check (max_hp > 0),
  current_hp int not null check (current_hp >= 0),
  defeated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (party_id, week_start)
);

create table if not exists public.boss_attacks (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.boss_battles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'legendary')),
  rolled_damage int not null check (rolled_damage > 0),
  damage int not null check (damage >= 0),
  hp_after int not null check (hp_after >= 0),
  created_at timestamptz not null default now()
);

create index if not exists boss_attacks_battle_created
  on public.boss_attacks (battle_id, created_at desc);
create index if not exists boss_attacks_user_battle
  on public.boss_attacks (user_id, battle_id);

-- ---------------------------------------------------------------------------
-- Helpers (internal: not granted to clients)
-- ---------------------------------------------------------------------------

create or replace function public.my_party_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.my_couple_id(), auth.uid())
$$;

-- Monday 00:00 UTC of the current week, matching getWeekBounds() in TS.
create or replace function public.battle_week_start()
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('week', now() at time zone 'utc')::date
$$;

-- Great-circle distance in meters.
create or replace function public.distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- Raises unless the fix is at the caller's gym. Returns nothing.
create or replace function public.assert_at_gym(
  p_uid uuid, p_lat double precision, p_lng double precision, p_accuracy double precision
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gym public.user_gyms;
begin
  if p_lat is null or p_lng is null or p_accuracy is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180
     or p_accuracy < 0 then
    raise exception 'invalid_location';
  end if;
  if p_accuracy > 500 then
    raise exception 'location_too_imprecise';
  end if;

  select * into v_gym from public.user_gyms where user_id = p_uid;
  if not found then
    raise exception 'no_gym_set';
  end if;

  if public.distance_m(v_gym.lat, v_gym.lng, p_lat, p_lng)
     > 150 + least(p_accuracy, 100) then
    raise exception 'not_at_gym';
  end if;
end;
$$;

-- Gets (or creates) the caller's party battle for this week.
create or replace function public.ensure_current_battle()
returns public.boss_battles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party uuid := public.my_party_id();
  v_week date := public.battle_week_start();
  v_count int;
  v_index int;
  v_boss public.bosses;
  v_battle public.boss_battles;
begin
  if v_party is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_battle from public.boss_battles
  where party_id = v_party and week_start = v_week;
  if found then
    return v_battle;
  end if;

  -- Same rotation as getCurrentBoss(): floor(weekStartMs / weekMs) mod count.
  select count(*) into v_count from public.bosses;
  v_index := mod(
    floor(extract(epoch from v_week::timestamp) / 604800)::bigint,
    v_count
  )::int;
  select * into v_boss from public.bosses
  order by rotation_order offset v_index limit 1;

  insert into public.boss_battles (party_id, week_start, boss_id, max_hp, current_hp)
  values (v_party, v_week, v_boss.id, v_boss.max_hp, v_boss.max_hp)
  on conflict (party_id, week_start) do nothing;

  select * into v_battle from public.boss_battles
  where party_id = v_party and week_start = v_week;
  return v_battle;
end;
$$;

-- Spins earned this week minus spins used on this week's battle.
create or replace function public.spins_available(p_uid uuid, p_battle_id uuid, p_week date)
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
       where a.user_id = p_uid and a.battle_id = p_battle_id)
  )::int
$$;

-- Ends a session whose last ping is over 3 h old, without crediting the gap.
create or replace function public.expire_stale_session(p_uid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.gym_sessions
  set ended_at = last_ping_at
  where user_id = p_uid
    and ended_at is null
    and last_ping_at < now() - interval '3 hours'
$$;

-- ---------------------------------------------------------------------------
-- Client RPCs
-- ---------------------------------------------------------------------------

-- Everything the battle screen needs, in one call.
create or replace function public.get_battle_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_battle public.boss_battles;
  v_partner uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.expire_stale_session(v_uid);
  v_battle := public.ensure_current_battle();

  select m.user_id into v_partner
  from public.couple_members m
  where m.couple_id = public.my_couple_id() and m.user_id <> v_uid
  limit 1;

  return jsonb_build_object(
    'battle', jsonb_build_object(
      'id', v_battle.id,
      'bossId', v_battle.boss_id,
      'bossName', (select name from public.bosses where id = v_battle.boss_id),
      'maxHp', v_battle.max_hp,
      'currentHp', v_battle.current_hp,
      'weekStart', v_battle.week_start,
      'defeatedAt', v_battle.defeated_at
    ),
    'spinsAvailable', public.spins_available(v_uid, v_battle.id, v_battle.week_start),
    'gym', (
      select jsonb_build_object('name', g.name, 'lat', g.lat, 'lng', g.lng, 'setAt', g.set_at)
      from public.user_gyms g where g.user_id = v_uid
    ),
    'session', (
      select jsonb_build_object(
        'startedAt', s.started_at,
        'lastPingAt', s.last_ping_at,
        'creditedSeconds', s.credited_seconds,
        'bonusSpin', s.bonus_spin
      )
      from public.gym_sessions s
      where s.user_id = v_uid and s.ended_at is null
    ),
    'partner', (
      select jsonb_build_object(
        'displayName', p.display_name,
        'atGym', exists (
          select 1 from public.gym_sessions s
          where s.user_id = v_partner and s.ended_at is null
            and s.last_ping_at > now() - interval '3 hours'
        )
      )
      from public.profiles p where p.id = v_partner
    ),
    'attacks', coalesce((
      select jsonb_agg(row_to_json(x) order by x."createdAt" desc)
      from (
        select a.id, a.rarity, a.damage, a.created_at as "createdAt",
               coalesce(p.display_name, 'Someone') as "displayName",
               a.user_id = v_uid as "mine"
        from public.boss_attacks a
        left join public.profiles p on p.id = a.user_id
        where a.battle_id = v_battle.id
        order by a.created_at desc
        limit 15
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- Sets the caller's home gym. Can change at most once every 7 days, and not
-- during a gym session, so it can't be moved to wherever you happen to be.
create or replace function public.set_my_gym(
  p_name text, p_lat double precision, p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_set_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_location';
  end if;
  if p_name is null or char_length(trim(p_name)) not between 1 and 60 then
    raise exception 'invalid_gym_name';
  end if;

  perform public.expire_stale_session(v_uid);
  if exists (select 1 from public.gym_sessions where user_id = v_uid and ended_at is null) then
    raise exception 'session_active';
  end if;

  select set_at into v_set_at from public.user_gyms where user_id = v_uid;
  if found and v_set_at > now() - interval '7 days' then
    raise exception 'gym_change_cooldown';
  end if;

  insert into public.user_gyms (user_id, name, lat, lng, set_at)
  values (v_uid, trim(p_name), p_lat, p_lng, now())
  on conflict (user_id) do update
    set name = excluded.name, lat = excluded.lat, lng = excluded.lng, set_at = excluded.set_at;
end;
$$;

-- Starts a gym session (or pings the active one). The first check-in in
-- 6 hours awards a bonus spin.
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

-- Banks time at the gym. The gap since the last ping is credited only if
-- this fix is still at the gym, and only up to 30 minutes. A fix away from
-- the gym ends the session without crediting the gap.
create or replace function public.gym_heartbeat(
  p_lat double precision, p_lng double precision, p_accuracy double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.gym_sessions;
  v_gap int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.expire_stale_session(v_uid);
  select * into v_session from public.gym_sessions
  where user_id = v_uid and ended_at is null
  for update;
  if not found then
    raise exception 'no_active_session';
  end if;

  begin
    perform public.assert_at_gym(v_uid, p_lat, p_lng, p_accuracy);
  exception when others then
    if sqlerrm = 'not_at_gym' then
      update public.gym_sessions set ended_at = now() where id = v_session.id;
      return;
    end if;
    raise;
  end;

  v_gap := least(
    greatest(0, floor(extract(epoch from now() - v_session.last_ping_at)))::int,
    1800
  );
  update public.gym_sessions
  set credited_seconds = least(credited_seconds + v_gap, 10800),
      last_ping_at = now()
  where id = v_session.id;
end;
$$;

-- Ends the active session. With a fix at the gym, the final gap is banked
-- first; without one (or away from the gym) it isn't.
create or replace function public.gym_check_out(
  p_lat double precision default null,
  p_lng double precision default null,
  p_accuracy double precision default null
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

  if p_lat is not null then
    begin
      perform public.gym_heartbeat(p_lat, p_lng, p_accuracy);
    exception when others then
      if sqlerrm not in ('no_active_session', 'location_too_imprecise') then
        raise;
      end if;
    end;
  end if;

  update public.gym_sessions set ended_at = now()
  where user_id = v_uid and ended_at is null;
end;
$$;

-- Spends one spin: rolls a rarity and damage, applies it to the boss and
-- returns the roll. The battle row lock serializes partners spinning at once.
create or replace function public.roll_spin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_battle public.boss_battles;
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
  if public.spins_available(v_uid, v_battle.id, v_battle.week_start) <= 0 then
    raise exception 'no_spins';
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

  insert into public.boss_attacks (battle_id, user_id, rarity, rolled_damage, damage, hp_after)
  values (v_battle.id, v_uid, v_rarity, v_damage, v_applied, v_hp);

  return jsonb_build_object(
    'rarity', v_rarity,
    'damage', v_damage,
    'appliedDamage', v_applied,
    'hpAfter', v_hp
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.my_party_id() from public, anon;
revoke all on function public.battle_week_start() from public, anon, authenticated;
revoke all on function public.distance_m(double precision, double precision, double precision, double precision) from public, anon, authenticated;
revoke all on function public.assert_at_gym(uuid, double precision, double precision, double precision) from public, anon, authenticated;
revoke all on function public.ensure_current_battle() from public, anon, authenticated;
revoke all on function public.spins_available(uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.expire_stale_session(uuid) from public, anon, authenticated;

revoke all on function public.get_battle_state() from public, anon;
revoke all on function public.set_my_gym(text, double precision, double precision) from public, anon;
revoke all on function public.gym_check_in(double precision, double precision, double precision) from public, anon;
revoke all on function public.gym_heartbeat(double precision, double precision, double precision) from public, anon;
revoke all on function public.gym_check_out(double precision, double precision, double precision) from public, anon;
revoke all on function public.roll_spin() from public, anon;

-- my_party_id() is used by the RLS policies below, so clients need it.
grant execute on function public.my_party_id() to authenticated;
grant execute on function public.get_battle_state() to authenticated;
grant execute on function public.set_my_gym(text, double precision, double precision) to authenticated;
grant execute on function public.gym_check_in(double precision, double precision, double precision) to authenticated;
grant execute on function public.gym_heartbeat(double precision, double precision, double precision) to authenticated;
grant execute on function public.gym_check_out(double precision, double precision, double precision) to authenticated;
grant execute on function public.roll_spin() to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security: clients may read, never write. All writes go through
-- the functions above.
-- ---------------------------------------------------------------------------

alter table public.bosses enable row level security;
alter table public.user_gyms enable row level security;
alter table public.gym_sessions enable row level security;
alter table public.boss_battles enable row level security;
alter table public.boss_attacks enable row level security;

drop policy if exists bosses_select_all on public.bosses;
create policy bosses_select_all on public.bosses
  for select to authenticated using (true);

drop policy if exists user_gyms_select_own on public.user_gyms;
create policy user_gyms_select_own on public.user_gyms
  for select to authenticated using (user_id = auth.uid());

drop policy if exists gym_sessions_select_self_or_partner on public.gym_sessions;
create policy gym_sessions_select_self_or_partner on public.gym_sessions
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.couple_members m
      where m.couple_id = public.my_couple_id() and m.user_id = gym_sessions.user_id
    )
  );

drop policy if exists boss_battles_select_party on public.boss_battles;
create policy boss_battles_select_party on public.boss_battles
  for select to authenticated using (party_id = public.my_party_id());

drop policy if exists boss_attacks_select_party on public.boss_attacks;
create policy boss_attacks_select_party on public.boss_attacks
  for select to authenticated
  using (
    exists (
      select 1 from public.boss_battles b
      where b.id = boss_attacks.battle_id and b.party_id = public.my_party_id()
    )
  );
