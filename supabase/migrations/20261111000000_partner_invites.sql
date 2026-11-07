-- Partner invites: shareable invite links, partner avatars and leaving a team.
-- Idempotent; safe to re-run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Invite code generator (shared by create_couple and leave_couple)
-- ---------------------------------------------------------------------------

-- Returns a fresh 6-character code that no couple uses yet.
-- 32-symbol alphabet without look-alikes (no I, O, 0, 1): ~1.07 billion codes.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  for attempt in 1..10 loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    if not exists (select 1 from public.couples where invite_code = v_code) then
      return v_code;
    end if;
  end loop;
  raise exception 'code_generation_failed';
end;
$$;

revoke all on function public.generate_invite_code() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Invite preview (used by the public /invite/<code> page)
-- ---------------------------------------------------------------------------

-- Tells a visitor whether an invite code is usable and, only when it is,
-- the inviter's display name. Nothing else about the inviter is exposed,
-- and full or unknown codes reveal nothing at all.
create or replace function public.get_invite_preview(p_code text)
returns table (status text, inviter_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_created_by uuid;
  v_members int;
begin
  select c.id, c.created_by into v_couple_id, v_created_by
  from public.couples c
  where c.invite_code = upper(trim(p_code));

  if not found then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  select count(*) into v_members
  from public.couple_members m
  where m.couple_id = v_couple_id;

  if v_members >= 2 then
    return query select 'full'::text, null::text;
    return;
  end if;

  if auth.uid() is not null and exists (
    select 1 from public.couple_members m
    where m.couple_id = v_couple_id and m.user_id = auth.uid()
  ) then
    return query select 'own'::text, null::text;
    return;
  end if;

  return query
  select 'open'::text, p.display_name
  from (select 1) as one
  left join public.profiles p
    on p.id = (
      select m.user_id from public.couple_members m
      where m.couple_id = v_couple_id
      limit 1
    );
end;
$$;

revoke all on function public.get_invite_preview(text) from public;
grant execute on function public.get_invite_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Leaving a team
-- ---------------------------------------------------------------------------

-- Removes the caller from their couple. If a partner stays behind, the
-- couple gets a new invite code so links shared earlier stop working.
-- An empty couple is deleted.
create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select m.couple_id into v_couple_id
  from public.couple_members m
  where m.user_id = v_uid;

  if not found then
    return;
  end if;

  -- Lock the couple so a concurrent join_couple cannot slip in.
  perform 1 from public.couples where id = v_couple_id for update;

  delete from public.couple_members
  where couple_id = v_couple_id and user_id = v_uid;

  if exists (select 1 from public.couple_members where couple_id = v_couple_id) then
    update public.couples
    set invite_code = public.generate_invite_code()
    where id = v_couple_id;
  else
    delete from public.couples where id = v_couple_id;
  end if;
end;
$$;

revoke all on function public.leave_couple() from public, anon;
grant execute on function public.leave_couple() to authenticated;

-- ---------------------------------------------------------------------------
-- Partner avatars: partners may read each other's avatar, nobody else can.
-- ---------------------------------------------------------------------------

drop policy if exists avatars_partner_select on storage.objects;
create policy avatars_partner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.couple_members m
      where m.couple_id = public.my_couple_id()
        and m.user_id::text = (storage.foldername(name))[1]
    )
  );
