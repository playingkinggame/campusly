# Deploying Campusly

## 1. Supabase

1. Create a Supabase project.
2. **SQL Editor** -> run these files **in order** (each one: paste all, press Run):
   1. `supabase/phase1_database.sql` (run it ONCE on a fresh project. Re-running wipes and rebuilds all policies)
   2. `supabase/phase2_additions.sql`
   3. `supabase/phase3_additions.sql` (lost & found photo bucket; safe to re-run)
   4. `supabase/phase4_password_auth.sql` (password sign-in helpers; safe to re-run)
   5. `supabase/phase5_confessions.sql` (12-hour confession expiry and admin moderation; safe to re-run)
   6. `supabase/phase6_themes.sql` (saved theme preference; safe to re-run, never overwrites a chosen theme). Optional check: `phase6_verify.sql`. If you ever re-run phase 1, run this again afterwards.
   7. `supabase/phase7_live_updates.sql` (heart notifications, event attendance counts, extra Realtime tables; safe to re-run)
   8. `supabase/phase8_privacy_and_limits.sql` (consent timestamp, Delete my account, 100 MB per-student upload quota; safe to re-run)
3. **Authentication -> Sign In / Providers -> Email**: Email provider ON, minimum password length `8`. Keep **Confirm email** ON for a real launch (students must click the link sent to their `@vitstudent.ac.in` inbox). For quick local testing you may turn it off.
4. **Authentication -> URL Configuration**: set **Site URL** to your live address. Add to **Redirect URLs**:
   - `http://localhost:3000/app.html`
   - `https://YOUR-DOMAIN/app.html`
5. **Project Settings -> Authentication -> SMTP**: add your own SMTP before launch (the built-in sender allows only a few emails per hour).
6. **Realtime**: Database -> Replication (Publications). `messages`, `message_reactions`, `message_receipts`, `connections` must be enabled for `supabase_realtime`.
7. **Project Settings -> API**: copy the Project URL and the `anon` / publishable key. Never use the `service_role` / secret key in this project.
8. **Delete the demo data** at the bottom of `phase1_database.sql` (the commented "REMOVE DEMO DATA BEFORE LAUNCH" block). Run those four `delete` lines once.

Only `@vitstudent.ac.in` emails can ever be created: the database trigger `enforce_vit_email` rejects every other domain, even if someone bypasses the website.

## 2. Cloudflare Turnstile (stop fake sign-ups)

Turnstile is free and Supabase verifies the token on its own servers, so the **secret key never enters this website**.

1. Sign in at Cloudflare -> **Turnstile** -> **Add widget**.
2. Name it `Campusly`. Hostnames: your Vercel domain (add it once Vercel gives you the URL) and `localhost` for development.
3. Widget mode: **Managed**. Copy the **Site Key** and the **Secret Key**.
4. Supabase Dashboard -> **Authentication** -> **Bot and Abuse Protection** (on older dashboards: **Project Settings -> Authentication**) -> enable **CAPTCHA protection**, choose **Cloudflare Turnstile**, paste the **Secret Key**, Save.
5. Put the **Site Key** (public) in `.env.local` and in Vercel:
   ```env
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
   ```
6. Redeploy. The check appears above the sign-up, log-in and forgot-password buttons, and above the resend buttons.

Local testing without a real widget: Cloudflare's documented always-pass pair is site key `1x00000000000000000000AA` and secret `1x0000000000000000000000000000000AA` — put the secret in Supabase *only while testing locally*, and switch both back before launch.

If CAPTCHA is enabled in Supabase but the site key is missing, every auth request fails with `captcha protection: request disallowed`. Add the key and reload.

## 3. Privacy, Terms and "Delete my account"

1. Edit `src/lib/legal.ts` before launch: set `CONTACT_EMAIL` to an inbox you actually monitor and put a real name in `GRIEVANCE_OFFICER`. Both pages read from this one file.
2. Run `supabase/phase8_privacy_and_limits.sql` (step 1.2.8). Without it the consent timestamp, the upload quota and Delete my account do not work.
3. Open `/app.html#/privacy` and `/app.html#/terms` while signed out; the landing footer links to both.
4. Sign-up now requires the consent checkbox. The acceptance date is stamped by a database trigger into `profiles.terms_accepted_at` when onboarding is completed — students cannot edit it.
5. **Delete my account** lives in Settings. It removes the student's files through the Storage API, then calls `delete_my_account()`, which deletes the auth user and cascades through every table. Test it once with a throwaway account (see step 8).
6. **Upload quota:** 100 MB per student, enforced by a trigger on `storage.objects` so even a modified browser cannot bypass it. To change the size, edit `storage_quota_bytes()` in phase 8 and re-run that function.
7. These pages are a solid, plain-language starting point, not legal advice. Have a lawyer (or your student legal cell) review them before launch — especially the grievance contact and governing-law clause.

## 4. Run locally

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
VITE_TURNSTILE_SITE_KEY=YOUR-TURNSTILE-SITE-KEY
```

```bash
npm install
npm run dev     # http://localhost:3000 (landing)  and  /app.html#/login (app)
npm run build   # type-check + production build
```

## 5. Make yourself admin

Sign up, confirm your email, then in the SQL editor (use your own email):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'your.name@vitstudent.ac.in'
on conflict do nothing;
```

Reload the app: **Admin** appears in the menu.

## 6. Deploy on Vercel

1. Push the project to GitHub (`.env` and `.env.local` are git-ignored; never commit them).
2. Vercel -> **Add New Project** -> import the repo. Framework: Vite. Build command `npm run build`. Output directory `dist` (`vercel.json` already says this).
3. **Settings -> Environment Variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.
4. Put the final Vercel address into Supabase **Site URL** and **Redirect URLs** (step 1.4).

## 7. Security checklist

Tables: every table has Row Level Security on (phase 1 turns it on for all of `public`).

| Item | What protects it |
| --- | --- |
| `profiles` | you read/update only your own row; others see `profiles_public` (hides room no., hidden reg no., hidden last seen, blocked people) |
| `messages` | members only; edit/unsend only by the sender within 10 minutes (database trigger) |
| `connections` | only the receiver can accept/decline; chat only between accepted connections |
| `confessions` | author column is unreadable by everyone; the app reads `confessions_feed`; only admins moderate |
| `admins`, `badges`, `user_badges` | no write access from the app |
| Chats and groups | created only by RPCs (`start_dm`, `create_group`, `join_public_group`, `add_group_member`) |
| `profiles.terms_accepted_at` | set only by a database trigger; the column is not in the student update grant |
| Storage uploads | 100 MB per student enforced by a trigger on `storage.objects` (phase 8) |
| `delete_my_account()` | `security definer`, takes no user id, deletes only `auth.uid()` |

Buckets: `avatars` is **public-read** (profile photos). `certificates`, `chat-files`, `voice-notes`, `notes` and `campus-photos` are **private** (signed URLs). Chat files and voice notes: conversation members only. Certificates, notes and campus photos: any signed-in student can view, only the owner uploads or deletes.

Also check: no `service_role` key anywhere in the code (`grep -ri service_role src`), and `.env` is not in the repository.

## 8. Pre-launch test (15 minutes, two browsers or one normal + one private window)

1. Sign up Account A with a real VIT email. A non-VIT email must show an error.
2. Confirm the email link, finish onboarding (photo, username, reg no.).
3. Sign up Account B the same way.
4. A: Discover -> Connect to B. B: Requests -> Accept.
5. A messages B: send text, an image, a PDF, a voice note (allow the microphone).
6. Check typing indicator, delivered/seen ticks, reply, reaction.
7. Edit a message, then unsend one. After 10 minutes both must be locked.
8. A creates a private group with B and posts a message and an announcement.
9. Post an event; B marks Going.
10. B posts a confession; confirm it shows "pending". Admin approves it in /admin; it appears on the feed with no author.
11. Report a post; resolve it in /admin.
12. Block B from A; B must no longer find A or message A.
13. Turnstile: submit sign-up without solving the check — it must be blocked; solve it and the account is created.
14. Settings shows storage usage. Upload past the quota and the app says "Upload limit reached".
15. With a throwaway account: Settings -> Delete my account -> type DELETE. You cannot log in again, the profile is gone, and their messages/posts disappear.

## 9. Likely errors and fixes

| Problem | Fix |
| --- | --- |
| `npm run build` fails on types | run `npx tsc --noEmit` and fix the first error shown |
| Email link opens but you are logged out / "link expired" | add the exact `.../app.html` address to Supabase Redirect URLs; links are single-use, request a new one |
| "Email rate limit exceeded" | add custom SMTP (step 1.5) |
| "Database error saving new user" | the email is not `@vitstudent.ac.in` |
| "We could not find your profile" | run `phase4_password_auth.sql`, log in again |
| "permission denied" / "row-level security" | a phase file was skipped or phase 1 was re-run without phase 2-4. Run them again in order |
| Lost & found photos broken for other students | re-run `phase3_additions.sql` |
| Image or file shows "expired" | signed links last about an hour; reload the page |
| Chat does not update live | enable the 4 tables in Realtime (step 1.6); check the browser console for websocket errors |
| Voice note will not record | allow the microphone in the browser; the site must be HTTPS (Vercel is) |
| `captcha protection: request disallowed` | Turnstile site key missing in `.env.local`/Vercel, or the domain is not listed on the Turnstile widget. The secret key belongs in Supabase, not the site |
| "Upload limit reached" right after deleting a file | Storage usage is recalculated from uploaded files; reload Settings to refresh it. Per-student usage is not shared between accounts |
| Delete my account fails | run `phase8_privacy_and_limits.sql`; the app must also be able to remove the student's files first. Check the browser console for the database message |
