# Deploying Campusly

## 1. Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run, in order:
   - `supabase/phase1_database.sql`
   - `supabase/phase2_additions.sql`
   - `supabase/phase3_additions.sql`
3. In **Authentication → Providers → Email**, decide whether email confirmation is on. For quick testing, turn it off.
4. In **Project Settings → API**, copy the Project URL and the **anon public** key. Never use the service-role key.

## 2. Local environment

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Then:

```bash
npm install
npm run dev
```

`npm run build` runs TypeScript and the production Vite build. `npm run preview` serves the build locally.

## 3. Make yourself admin (after signing up once)

In the SQL editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com'
on conflict do nothing;
```

Reload the app; the **Admin** item appears in the sidebar.

## 4. Hosting

This is a static single-page app using `HashRouter`, so any static host works without rewrite rules.

- **Netlify / Vercel:** build command `npm run build`, output directory `dist`.
- **GitHub Pages:** publish `dist`; the hash routes work without a 404 fallback.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings before building.

## 5. Storage buckets

Phase 1 creates `avatars`, `certificates`, `chat-files`, `voice-notes` and `notes`. Phase 3 adds the private `campus-photos` bucket for lost-and-found photos. All buckets are private and accessed with short-lived signed URLs.

## 6. Realtime

Phase 1 adds `messages`, `message_reactions`, `message_receipts` and `connections` to the `supabase_realtime` publication. Chat, typing indicators, receipts and connection badges use Realtime. If chat does not update live, check **Database → Replication** and confirm those tables are enabled.
