-- Gyms picked from Google Places, and a 1 mile check-in radius.
-- Run after 20261107000000_boss_battles.sql.
--
-- user_gyms.place_id is the Google place ID of the gym the player picked.
-- With a place ID, lat/lng is the gym's location from Google; without one
-- (no Places key configured), it's where the player stood when saving.
--
-- Keep in sync with src/lib/battle/rules.ts: check-ins must be within
-- 1609 m (1 mile) of the gym, plus up to 100 m of reported GPS accuracy.

alter table public.user_gyms
  add column if not exists place_id text
    check (place_id is null or char_length(place_id) between 1 and 300);

drop function if exists public.set_my_gym(text, double precision, double precision);

create or replace function public.set_my_gym(
  p_name text,
  p_lat double precision,
  p_lng double precision,
  p_place_id text default null
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
  if p_place_id is not null and char_length(p_place_id) not between 1 and 300 then
    raise exception 'invalid_place';
  end if;

  perform public.expire_stale_session(v_uid);
  if exists (select 1 from public.gym_sessions where user_id = v_uid and ended_at is null) then
    raise exception 'session_active';
  end if;

  select set_at into v_set_at from public.user_gyms where user_id = v_uid;
  if found and v_set_at > now() - interval '7 days' then
    raise exception 'gym_change_cooldown';
  end if;

  insert into public.user_gyms (user_id, name, lat, lng, place_id, set_at)
  values (v_uid, trim(p_name), p_lat, p_lng, p_place_id, now())
  on conflict (user_id) do update
    set name = excluded.name,
        lat = excluded.lat,
        lng = excluded.lng,
        place_id = excluded.place_id,
        set_at = excluded.set_at;
end;
$$;

revoke all on function public.set_my_gym(text, double precision, double precision, text) from public, anon;
grant execute on function public.set_my_gym(text, double precision, double precision, text) to authenticated;

-- Same as in 20261107000000_boss_battles.sql, with the radius widened from
-- 150 m to 1 mile.
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
     > 1609 + least(p_accuracy, 100) then
    raise exception 'not_at_gym';
  end if;
end;
$$;

revoke all on function public.assert_at_gym(uuid, double precision, double precision, double precision) from public, anon, authenticated;
