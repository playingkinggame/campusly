-- =====================================================================
-- CAMPUSLY — PHASE 5: CONFESSION RULES
-- Run AFTER phase1 + phase2 (+ phase3/4). Safe to run again and again.
-- Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run.
--
-- What this does
--   1. Admins can see WHO wrote a confession (name + username) while reviewing it.
--      Students still cannot: the public feed has no author column at all.
--   2. An approved confession disappears from the feed 12 hours after approval.
--      (It stays in the database so admins can still see it under "Expired".)
--   3. Admins can delete any confession at any time (pending, live or expired).
--
-- NOTE: phase1_database.sql replaces the view in step 2 if you ever re-run it.
--       If you re-run phase 1, run this file again afterwards.
-- =====================================================================

-- 1+2. The public feed: approved AND approved less than 12 hours ago.
--      expires_at is added at the END of the column list (allowed by "create or replace view").
create or replace view public.confessions_feed with (security_barrier = true) as
select c.id, c.body, c.created_at,
       (c.reviewed_at + interval '12 hours') as expires_at
from public.confessions c
where c.status = 'approved'
  and c.reviewed_at is not null
  and c.reviewed_at > now() - interval '12 hours';

grant select on public.confessions_feed to authenticated;


-- 1. Admin list with the author's name. scope = pending | live | expired | all
drop function if exists public.admin_list_confessions(text);
create or replace function public.admin_list_confessions(p_scope text default 'pending')
returns table (
  id uuid, body text, status text, created_at timestamptz,
  reviewed_at timestamptz, expires_at timestamptz,
  author_id uuid, author_username text, author_name text, author_reg_no text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_scope not in ('pending','live','expired','all') then raise exception 'Invalid scope'; end if;
  return query
    select c.id, c.body, c.status, c.created_at, c.reviewed_at,
           case when c.status = 'approved' then c.reviewed_at + interval '12 hours' end,
           c.author_id, p.username, p.full_name, p.reg_no
    from public.confessions c
    left join public.profiles p on p.id = c.author_id
    where case p_scope
            when 'pending' then c.status = 'pending'
            when 'live'    then c.status = 'approved' and c.reviewed_at > now() - interval '12 hours'
            when 'expired' then c.status = 'approved' and c.reviewed_at <= now() - interval '12 hours'
            else true
          end
    order by case when p_scope = 'pending' then c.created_at end asc,
             c.created_at desc
    limit 300;
end $$;


-- 3. Admin can delete any confession, any time.
create or replace function public.admin_delete_confession(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from public.confessions where id = p_id;
  -- reports about that confession are closed automatically
  update public.reports
     set status = 'actioned', reviewed_by = auth.uid(), reviewed_at = now()
   where target_type = 'confession' and target_id = p_id and status in ('open','reviewing');
end $$;


-- Privileges: nobody (public / anon) can run these; only signed-in users (the function itself checks is_admin()).
revoke all on function public.admin_list_confessions(text) from public, anon, authenticated;
revoke all on function public.admin_delete_confession(uuid) from public, anon, authenticated;
grant execute on function public.admin_list_confessions(text), public.admin_delete_confession(uuid) to authenticated;

notify pgrst, 'reload schema';
