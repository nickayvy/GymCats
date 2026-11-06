-- Workout logging, growth tracking and spin rewards.
--
-- A user logs a workout: a list of exercises, each with sets of reps x weight.
-- Every exercise is compared with the user's previous session of the same
-- exercise. Beating it (heavier top set, more total volume, or more reps on
-- bodyweight work) is a "growth" and earns 1 spin.
--
-- All writes go through log_workout(), a security definer function, so users
-- cannot insert rows or edit their spin balance directly.
-- Idempotent where practical; safe to re-run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  performed_at timestamptz not null default now(),
  spins_earned int not null default 0 check (spins_earned >= 0),
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_performed_idx
  on public.workouts (user_id, performed_at desc);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position int not null check (position >= 0),
  exercise_name text not null check (char_length(exercise_name) between 1 and 60),
  -- Lowercased, whitespace-collapsed name. Sessions are matched on this.
  exercise_key text not null check (char_length(exercise_key) between 1 and 60),
  -- [{ "reps": int, "weight_lb": number }, ...] in the order performed.
  sets jsonb not null check (jsonb_typeof(sets) = 'array'),
  set_count int not null,
  total_reps int not null,
  top_weight_lb numeric(6,1) not null,
  volume_lb numeric(10,1) not null,
  grew boolean not null default false,
  spin_awarded boolean not null default false,
  performed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists workout_exercises_user_key_idx
  on public.workout_exercises (user_id, exercise_key, performed_at desc);

create index if not exists workout_exercises_workout_idx
  on public.workout_exercises (workout_id, position);

-- Spin balance. One row per user, created on first reward.
create table if not exists public.spin_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  spins int not null default 0 check (spins >= 0),
  lifetime_spins int not null default 0 check (lifetime_spins >= 0),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- log_workout(p_exercises jsonb) -> jsonb
--
-- p_exercises: [{ "name": text, "sets": [{ "reps": int, "weight_lb": number }] }]
--
-- Returns:
-- {
--   "workout_id": uuid,
--   "spins_earned": int,
--   "spins_balance": int,
--   "exercises": [{
--     "name": text,
--     "grew": bool,           -- beat the previous session
--     "spin_awarded": bool,   -- grew and not on cooldown
--     "previous_sets": jsonb  -- previous session's sets, or null (baseline)
--   }]
-- }
--
-- Anti-farming: an exercise earns at most one spin per 20 hours, so logging
-- the same lift twice in a row does not pay out twice.
-- ---------------------------------------------------------------------------

create or replace function public.log_workout(p_exercises jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_workout_id uuid;
  v_exercise jsonb;
  v_set jsonb;
  v_position int := 0;
  v_name text;
  v_key text;
  v_keys text[] := '{}';
  v_reps int;
  v_weight numeric;
  v_set_count int;
  v_total_reps int;
  v_top_weight numeric;
  v_volume numeric;
  v_prev public.workout_exercises%rowtype;
  v_has_prev boolean;
  v_grew boolean;
  v_on_cooldown boolean;
  v_spin boolean;
  v_spins_earned int := 0;
  v_balance int;
  v_results jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if jsonb_typeof(p_exercises) is distinct from 'array'
     or jsonb_array_length(p_exercises) not between 1 and 20 then
    raise exception 'invalid_exercises';
  end if;

  -- Serialise logging per user so concurrent calls cannot both claim a spin.
  perform pg_advisory_xact_lock(hashtextextended('log_workout:' || v_uid::text, 0));

  insert into public.workouts (user_id, performed_at)
  values (v_uid, v_now)
  returning id into v_workout_id;

  for v_exercise in select value from jsonb_array_elements(p_exercises)
  loop
    if jsonb_typeof(v_exercise) is distinct from 'object'
       or jsonb_typeof(v_exercise -> 'name') is distinct from 'string'
       or jsonb_typeof(v_exercise -> 'sets') is distinct from 'array' then
      raise exception 'invalid_exercises';
    end if;

    v_name := regexp_replace(btrim(v_exercise ->> 'name'), '\s+', ' ', 'g');
    v_key := lower(v_name);
    if char_length(v_name) not between 1 and 60 then
      raise exception 'invalid_exercise_name';
    end if;
    if v_key = any (v_keys) then
      raise exception 'duplicate_exercise';
    end if;
    v_keys := v_keys || v_key;

    if jsonb_array_length(v_exercise -> 'sets') not between 1 and 20 then
      raise exception 'invalid_sets';
    end if;

    v_set_count := 0;
    v_total_reps := 0;
    v_top_weight := 0;
    v_volume := 0;
    for v_set in select value from jsonb_array_elements(v_exercise -> 'sets')
    loop
      if jsonb_typeof(v_set -> 'reps') is distinct from 'number'
         or jsonb_typeof(v_set -> 'weight_lb') is distinct from 'number' then
        raise exception 'invalid_sets';
      end if;
      v_reps := (v_set ->> 'reps')::numeric;
      v_weight := round((v_set ->> 'weight_lb')::numeric, 1);
      if (v_set ->> 'reps')::numeric <> v_reps
         or v_reps not between 1 and 1000
         or v_weight not between 0 and 2000 then
        raise exception 'invalid_sets';
      end if;
      v_set_count := v_set_count + 1;
      v_total_reps := v_total_reps + v_reps;
      v_top_weight := greatest(v_top_weight, v_weight);
      v_volume := v_volume + v_reps * v_weight;
    end loop;

    select * into v_prev
    from public.workout_exercises e
    where e.user_id = v_uid
      and e.exercise_key = v_key
      and e.workout_id <> v_workout_id
    order by e.performed_at desc, e.created_at desc
    limit 1;
    v_has_prev := found;

    v_grew := v_has_prev and (
      v_top_weight > v_prev.top_weight_lb
      or v_volume > v_prev.volume_lb
      or (v_top_weight = 0 and v_prev.top_weight_lb = 0
          and v_total_reps > v_prev.total_reps)
    );

    v_on_cooldown := exists (
      select 1
      from public.workout_exercises e
      where e.user_id = v_uid
        and e.exercise_key = v_key
        and e.spin_awarded
        and e.performed_at > v_now - interval '20 hours'
    );

    v_spin := v_grew and not v_on_cooldown;
    if v_spin then
      v_spins_earned := v_spins_earned + 1;
    end if;

    insert into public.workout_exercises (
      workout_id, user_id, position, exercise_name, exercise_key, sets,
      set_count, total_reps, top_weight_lb, volume_lb,
      grew, spin_awarded, performed_at
    ) values (
      v_workout_id, v_uid, v_position, v_name, v_key,
      (
        select jsonb_agg(
          jsonb_build_object(
            'reps', (s ->> 'reps')::int,
            'weight_lb', round((s ->> 'weight_lb')::numeric, 1)
          )
          order by ord
        )
        from jsonb_array_elements(v_exercise -> 'sets') with ordinality as t(s, ord)
      ),
      v_set_count, v_total_reps, v_top_weight, v_volume,
      v_grew, v_spin, v_now
    );

    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'name', v_name,
      'grew', v_grew,
      'spin_awarded', v_spin,
      'previous_sets', case when v_has_prev then v_prev.sets else null end
    ));

    v_position := v_position + 1;
  end loop;

  update public.workouts
  set spins_earned = v_spins_earned
  where id = v_workout_id;

  insert into public.spin_wallets (user_id, spins, lifetime_spins)
  values (v_uid, v_spins_earned, v_spins_earned)
  on conflict (user_id) do update
    set spins = public.spin_wallets.spins + excluded.spins,
        lifetime_spins = public.spin_wallets.lifetime_spins + excluded.lifetime_spins,
        updated_at = now()
  returning spins into v_balance;

  return jsonb_build_object(
    'workout_id', v_workout_id,
    'spins_earned', v_spins_earned,
    'spins_balance', v_balance,
    'exercises', v_results
  );
end;
$$;

revoke all on function public.log_workout(jsonb) from public, anon;
grant execute on function public.log_workout(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security: read your own rows or your partner's. No write
-- policies; all writes go through log_workout().
-- ---------------------------------------------------------------------------

alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.spin_wallets enable row level security;

drop policy if exists workouts_select_self_or_partner on public.workouts;
create policy workouts_select_self_or_partner on public.workouts
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.couple_members m
      where m.couple_id = public.my_couple_id()
        and m.user_id = workouts.user_id
    )
  );

drop policy if exists workout_exercises_select_self_or_partner on public.workout_exercises;
create policy workout_exercises_select_self_or_partner on public.workout_exercises
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.couple_members m
      where m.couple_id = public.my_couple_id()
        and m.user_id = workout_exercises.user_id
    )
  );

drop policy if exists spin_wallets_select_self_or_partner on public.spin_wallets;
create policy spin_wallets_select_self_or_partner on public.spin_wallets
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.couple_members m
      where m.couple_id = public.my_couple_id()
        and m.user_id = spin_wallets.user_id
    )
  );
