-- Shrink the check-in radius from 1 mile to 150 m.
-- Run after 20261108000000_gym_places.sql.
--
-- Same as assert_at_gym() in 20261108000000_gym_places.sql with 1609 m
-- replaced by 150 m. The GPS accuracy slack (up to 100 m) is unchanged.
-- gym_check_in() and gym_heartbeat() both call this function, so check-ins
-- and every location check during a session use the new radius.
--
-- Keep in sync with GYM_RADIUS_M in src/lib/battle/rules.ts, which also sets
-- how far the gym picker searches.

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

revoke all on function public.assert_at_gym(uuid, double precision, double precision, double precision) from public, anon, authenticated;
