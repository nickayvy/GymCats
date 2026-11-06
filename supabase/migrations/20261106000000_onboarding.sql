-- Onboarding: profiles, couples (partner pairing), avatar storage.
-- Idempotent where practical; safe to re-run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  age int not null check (age between 13 and 100),
  height_cm numeric(5,1) not null check (height_cm between 100 and 250),
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 300),
  unit_system text not null default 'imperial'
    check (unit_system in ('imperial', 'metric')),
  health_notes text not null default ''
    check (char_length(health_notes) <= 500),
  weekly_free_minutes int not null check (weekly_free_minutes between 30 and 1200),
  goal_presets text[] not null default '{}',
  goal_freeform text not null default ''
    check (char_length(goal_freeform) <= 1000),
  goal_plan jsonb,
  workouts_per_week int not null check (workouts_per_week between 1 and 7),
  avatar_path text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper and RPC functions
-- ---------------------------------------------------------------------------

-- Returns the caller's couple id, or null. Security definer so that RLS
-- policies on couple_members can call it without recursing into RLS.
create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = auth.uid()
$$;

-- Creates a couple for the caller (or returns the existing invite code).
create or replace function public.create_couple()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_existing_code text;
  v_couple_id uuid;
  v_code text;
  v_attempt int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.invite_code into v_existing_code
  from public.couple_members m
  join public.couples c on c.id = m.couple_id
  where m.user_id = v_uid;

  if found then
    return v_existing_code;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;

    begin
      insert into public.couples (invite_code, created_by)
      values (v_code, v_uid)
      returning id into v_couple_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'code_generation_failed';
      end if;
    end;
  end loop;

  insert into public.couple_members (couple_id, user_id)
  values (v_couple_id, v_uid);

  return v_code;
end;
$$;

-- Joins the couple that owns p_code. Locks the couple row so two partners
-- joining at once cannot both pass the member-count check.
create or replace function public.join_couple(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
  v_current_couple_id uuid;
  v_members int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.id into v_couple_id
  from public.couples c
  where c.invite_code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  select m.couple_id into v_current_couple_id
  from public.couple_members m
  where m.user_id = v_uid;

  if found then
    if v_current_couple_id = v_couple_id then
      raise exception 'own_code';
    end if;
    raise exception 'already_paired';
  end if;

  select count(*) into v_members
  from public.couple_members m
  where m.couple_id = v_couple_id;

  if v_members >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.couple_members (couple_id, user_id)
  values (v_couple_id, v_uid);

  return v_couple_id;
end;
$$;

revoke all on function public.my_couple_id() from public, anon;
revoke all on function public.create_couple() from public, anon;
revoke all on function public.join_couple(text) from public, anon;

grant execute on function public.my_couple_id() to authenticated;
grant execute on function public.create_couple() to authenticated;
grant execute on function public.join_couple(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

-- Profiles: read your own row or your partner's. Write only your own row.
-- No delete policy, so profiles cannot be deleted by clients.
drop policy if exists profiles_select_self_or_partner on public.profiles;
create policy profiles_select_self_or_partner on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.couple_members m
      where m.couple_id = public.my_couple_id()
        and m.user_id = profiles.id
    )
  );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Couples and memberships: read only, and only for your own couple.
-- All writes go through create_couple() and join_couple().
drop policy if exists couples_select_member on public.couples;
create policy couples_select_member on public.couples
  for select to authenticated
  using (id = public.my_couple_id());

drop policy if exists couple_members_select_member on public.couple_members;
create policy couple_members_select_member on public.couple_members
  for select to authenticated
  using (couple_id = public.my_couple_id());

-- ---------------------------------------------------------------------------
-- Avatar storage (private bucket, one folder per user: <user_id>/avatar)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists avatars_own_select on storage.objects;
create policy avatars_own_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_own_insert on storage.objects;
create policy avatars_own_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_own_update on storage.objects;
create policy avatars_own_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
