-- ============================================================================
-- CAMPUSLY — PHASE 8: CONSENT, ACCOUNT DELETION & UPLOAD LIMITS
--
-- Run this AFTER phase1 ... phase7, in the Supabase SQL editor.
-- It is safe to re-run: it only adds a column, functions and triggers.
--
-- What it does
--   1. Records WHEN a student accepted the Terms + Privacy Policy (server-side,
--      not editable from the browser). The sign-up form requires the checkbox;
--      the timestamp is stamped when onboarding is completed.
--   2. delete_my_account(): lets a signed-in student permanently delete their
--      account. Every public table cascades from profiles, and auth.users
--      cascades to sessions/identities, so one delete removes everything.
--   3. A 100 MB per-student storage quota, enforced inside the database, so a
--      modified browser or a script cannot upload past it.
--   4. my_storage_usage() / my_storage_paths() for the Settings screen and for
--      cleaning up files before the account is deleted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Consent record
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

create or replace function public.profiles_stamp_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The sign-up form requires accepting the Terms + Privacy Policy. We record
  -- it once, when the student finishes onboarding (their profile is created).
  if new.onboarded and new.terms_accepted_at is null then
    new.terms_accepted_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_consent on public.profiles;
create trigger trg_profiles_consent
  before insert or update on public.profiles
  for each row execute function public.profiles_stamp_consent();

revoke all on function public.profiles_stamp_consent() from public, anon, authenticated;

-- terms_accepted_at is deliberately NOT added to the profiles update grant:
-- only this trigger can set it, so the consent date cannot be forged.

-- ----------------------------------------------------------------------------
-- 2. Per-student upload quota
--
-- 100 MB per student across all buckets. Change the number in ONE place:
-- public.storage_quota_bytes() below.
-- ----------------------------------------------------------------------------
create or replace function public.storage_quota_bytes()
returns bigint
language sql
immutable
set search_path = ''
as $$
  select 104857600::bigint   -- 100 MB
$$;

/** Total bytes a student currently stores (all app buckets). */
create or replace function public.user_storage_bytes(p_user uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(coalesce((o.metadata->>'size')::bigint, 0)), 0)
  from storage.objects o
  where (
          o.bucket_id in ('avatars', 'certificates', 'campus-photos')
          and (storage.foldername(o.name))[1] = p_user::text
        )
     or (
          o.bucket_id in ('chat-files', 'voice-notes', 'notes')
          and (storage.foldername(o.name))[2] = p_user::text
        );
$$;

/** Used by the Settings screen: "x MB of 100 MB used". */
create or replace function public.my_storage_usage()
returns table (used_bytes bigint, limit_bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select public.user_storage_bytes(auth.uid()), public.storage_quota_bytes();
$$;

/**
 * Hard quota check. Runs BEFORE every storage insert. The owning student is
 * read from the object path, not from the request, so it cannot be spoofed:
 *   avatars/<uid>/...  certificates/<uid>/...  campus-photos/<uid>/...
 *   chat-files/<conversation>/<uid>/...  voice-notes/<conversation>/<uid>/...
 *   notes/<room>/<uid>/...
 * The raised message is shown to the student by the app as-is.
 */
create or replace function public.enforce_storage_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  incoming bigint := coalesce((new.metadata->>'size')::bigint, 0);
  used bigint;
  cap bigint := public.storage_quota_bytes();
begin
  if new.bucket_id in ('avatars', 'certificates', 'campus-photos') then
    owner_id := nullif((storage.foldername(new.name))[1], '')::uuid;
  elsif new.bucket_id in ('chat-files', 'voice-notes', 'notes') then
    owner_id := nullif((storage.foldername(new.name))[2], '')::uuid;
  else
    return new;   -- buckets added later: no quota rule yet
  end if;

  if owner_id is null then
    return new;   -- not a user folder; the storage policies reject these anyway
  end if;

  used := public.user_storage_bytes(owner_id);
  if used + incoming > cap then
    raise exception 'Upload limit reached: you have used % of %. Delete some files to free space.',
      pg_size_pretty(used), pg_size_pretty(cap);
  end if;
  return new;
end $$;

drop trigger if exists trg_storage_quota on storage.objects;
create trigger trg_storage_quota
  before insert on storage.objects
  for each row execute function public.enforce_storage_quota();

revoke all on function public.storage_quota_bytes() from public, anon, authenticated;
revoke all on function public.user_storage_bytes(uuid) from public, anon, authenticated;
revoke all on function public.enforce_storage_quota() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Files owned by the signed-in student (used by "Delete my account")
-- ----------------------------------------------------------------------------
create or replace function public.my_storage_paths()
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.bucket_id, o.name
  from storage.objects o
  where (
          o.bucket_id in ('avatars', 'certificates', 'campus-photos')
          and (storage.foldername(o.name))[1] = auth.uid()::text
        )
     or (
          o.bucket_id in ('chat-files', 'voice-notes', 'notes')
          and (storage.foldername(o.name))[2] = auth.uid()::text
        );
$$;

revoke all on function public.my_storage_usage() from public, anon, authenticated;
revoke all on function public.my_storage_paths() from public, anon, authenticated;
grant execute on function public.my_storage_usage() to authenticated;
grant execute on function public.my_storage_paths() to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Delete my account
--
-- Uses auth.uid() from the JWT — there is no user id argument, so a student
-- can only ever delete their own account. Deleting auth.users cascades to
-- public.profiles and from there to every table (messages, posts, connections,
-- notifications, ...). Storage rows are removed first because Supabase refuses
-- to delete an Auth user that still owns storage objects.
-- ----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Please log in again before deleting your account.';
  end if;

  delete from storage.objects o
   where (
           o.bucket_id in ('avatars', 'certificates', 'campus-photos')
           and (storage.foldername(o.name))[1] = me::text
         )
      or (
           o.bucket_id in ('chat-files', 'voice-notes', 'notes')
           and (storage.foldername(o.name))[2] = me::text
         );

  delete from auth.users where id = me;
end $$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Make PostgREST see the new functions immediately
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';
