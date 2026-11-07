-- Let players switch gyms whenever they aren't mid-session.
-- Run after 20261108000000_gym_places.sql.
--
-- Check-in now starts by picking the gym you're at from the gyms near you,
-- so user_gyms holds the gym you last checked in at rather than a home gym
-- locked for a week. Same as set_my_gym() in 20261108000000_gym_places.sql
-- without the 7 day gym_change_cooldown. Switching mid-session is still
-- refused (session_active), so a session's time is always measured against
-- one gym. The check-in bonus is per player (once every 6 hours), so
-- switching gyms doesn't earn extra attacks.

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
