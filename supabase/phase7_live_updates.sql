-- =====================================================================
-- CAMPUSLY: PHASE 7, LIVE UPDATES
-- Run in Supabase -> SQL Editor (safe to run again).
-- What it does:
--   1. A heart now creates a notification for the person who got it.
--   2. Events keep a going_count so everyone sees "Going" change live.
--   3. Turns on Realtime for the tables the app now watches.
-- Run phase1 to phase6 first.
-- =====================================================================

-- 1. notifications can be of kind 'heart' ------------------------------
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('connection_request','connection_accepted','teammate_invite','senior_question','senior_answer','heart'));

create or replace function public.notify_heart() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, actor_id, ref_id)
    values (new.to_user, 'heart', new.from_user, new.id);
  return null;
end $$;

create or replace trigger trg_hearts_notify
  after insert on public.hearts
  for each row execute function public.notify_heart();

-- 2. events.going_count (a "ping" so Realtime can tell everyone) --------
alter table public.events add column if not exists going_count integer not null default 0;

update public.events e
   set going_count = (select count(*) from public.event_going g where g.event_id = e.id)
 where going_count <> (select count(*) from public.event_going g where g.event_id = e.id);

create or replace function public.event_going_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.events set going_count = going_count + 1 where id = new.event_id;
  elsif tg_op = 'DELETE' then
    update public.events set going_count = greatest(going_count - 1, 0) where id = old.event_id;
  end if;
  return null;
end $$;

create or replace trigger trg_event_going_touch
  after insert or delete on public.event_going
  for each row execute function public.event_going_touch();

-- trigger functions are never called by the app directly
revoke execute on function public.notify_heart()       from public, anon, authenticated;
revoke execute on function public.event_going_touch()  from public, anon, authenticated;

-- 3. Realtime for the tables the app watches ----------------------------
-- Row Level Security still decides who receives which change.
-- (profiles: each person only ever receives changes to their OWN row.)
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'profiles', 'notifications', 'events', 'notices', 'teammate_posts', 'teammate_invites',
      'study_rooms', 'study_notes', 'lost_found', 'rides', 'senior_questions',
      'groups', 'user_badges', 'reports', 'connections'
    ] loop
      if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t)
         and not exists (select 1 from pg_publication_tables
                         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

notify pgrst, 'reload schema';
