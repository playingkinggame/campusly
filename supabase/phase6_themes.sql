-- =====================================================================
-- CAMPUSLY — PHASE 6: SAVED THEME PREFERENCE
-- Run AFTER phase1 + phase2 (+ phase3/4/5). Safe to run again and again.
-- Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run.
--
-- What this does
--   1. Adds profiles.theme (text, default 'midnight-aurora').
--        - Every EXISTING account gets 'midnight-aurora' (nobody had a saved theme before).
--        - Every NEW account gets it automatically too: the sign-up trigger inserts only the id,
--          so the column default applies. No change to handle_new_user() is needed.
--        - Running this file again NEVER overwrites a theme someone has already chosen
--          ("add column if not exists" does nothing the second time).
--   2. A light format check (lowercase words joined by dashes). The app itself only accepts the
--      six known theme ids and falls back to Midnight Aurora for anything else, so adding a
--      seventh theme later needs NO database change.
--   3. Lets signed-in users update this one column. Row-level security (profiles_update_own from
--      phase 1: id = auth.uid()) still decides WHICH row, so nobody can change another
--      person's theme. Nothing new is exposed to other users: profiles_public does not include it.
--
-- NOTE: phase1_database.sql revokes and re-grants profile columns. If you ever re-run phase 1,
--       run this file again afterwards.
-- =====================================================================

alter table public.profiles
  add column if not exists theme text not null default 'midnight-aurora';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_theme_fmt' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_theme_fmt
      check (char_length(theme) <= 40 and theme ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;

-- Column-level grant (same pattern as the other editable profile columns in phase 1).
grant update (theme) on public.profiles to authenticated;
