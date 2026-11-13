import { LegalLayout, LegalSection, LegalList } from './LegalLayout';
import {
  APP_NAME, CONTACT_EMAIL, GRIEVANCE_EMAIL, GRIEVANCE_OFFICER, OPERATOR,
} from '@/lib/legal';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`${APP_NAME} is a student-run campus app for VIT Chennai. This page explains, in plain language, what we collect, why we need it, who can see it, and how you can get it deleted. It is written to match India's Digital Personal Data Protection Act, 2023 (DPDP Act).`}
    >
      <LegalSection id="who-we-are" title="1. Who we are">
        <p>
          {APP_NAME} is run by {OPERATOR}. It is not an official service of Vellore Institute of
          Technology (VIT), and it is not operated by the university. For anything in this policy,
          write to <a className="font-semibold text-forest underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          We act as the data fiduciary for the personal data described below. Our hosting providers
          (listed in section 5) process it on our instructions.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="2. What we collect">
        <p>We only collect what the app needs to work:</p>
        <LegalList>
          <li>
            <strong>Account and identity:</strong> your full name, VIT student email address,
            password (stored and hashed by our authentication provider — we never see it),
            registration number, batch, branch, school, day-scholar/hosteller status, hostel block
            and room number.
          </li>
          <li>
            <strong>Profile content:</strong> username, profile photo, bio, clubs, languages,
            interests, social link, achievements and any certificates you upload.
          </li>
          <li>
            <strong>What you post or send:</strong> direct and group messages, photos, files and
            voice notes, events, teammate posts, study rooms and notes, lost &amp; found posts,
            ride offers, confessions, senior questions and answers, notices, reports and blocks.
          </li>
          <li>
            <strong>Activity:</strong> last-seen time and online status, daily streak, hearts
            received, message delivered/seen receipts and unread counts.
          </li>
          <li>
            <strong>Device and security data:</strong> IP address, browser/device information and
            security logs generated when you use the service, kept by our hosting providers.
          </li>
          <li>
            <strong>On your device only:</strong> your chosen theme and sidebar preference, kept in
            your browser's local storage.
          </li>
        </LegalList>
        <p>
          We do not collect your location, contacts, calendar, camera roll or data from other apps.
          Photos and files are only read when you choose to upload them.
        </p>
      </LegalSection>

      <LegalSection id="why" title="3. Why we use it, and our legal basis">
        <LegalList>
          <li><strong>To create and run your account</strong> — you consent when you sign up by ticking the box that links to this policy and our Terms.</li>
          <li><strong>To verify that members are VIT students</strong> using the email-domain and registration-number checks.</li>
          <li><strong>To provide the features you use</strong> — showing your profile to other students, matching you on Discover, delivering messages, and running campus boards.</li>
          <li><strong>To keep the community safe</strong> — reviewing reports, moderating confessions, blocking abusive accounts and preventing spam or automated sign-ups.</li>
          <li><strong>To meet legal obligations</strong> and to respond to lawful requests from authorities.</li>
        </LegalList>
        <p>
          You can withdraw consent at any time by deleting your account or by writing to us. That
          stops future processing; it does not undo what was already lawfully done.
        </p>
      </LegalSection>

      <LegalSection id="visible" title="4. What other students can see">
        <LegalList>
          <li>
            Other signed-in students can see your public profile: name, username, photo, batch,
            branch, school, residence type, hostel block, clubs, languages, interests, bio, social
            link, streak, hearts and — if you allow it in your privacy settings — your registration
            number and last-seen time.
          </li>
          <li>
            <strong>Your room number is never shown to other students.</strong> Registration number
            and last-seen time are hidden automatically if you turn those toggles off.
          </li>
          <li>
            Messages and files are visible only to the people in that conversation. Confession
            authors are hidden from students; admins can see authorship during moderation (see
            section 6).
          </li>
          <li>
            Blocking someone stops them from finding or messaging you in the app.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="sharing" title="5. Who we share it with">
        <p>We never sell your data and we do not run advertising. We share it only with the providers that run the app:</p>
        <LegalList>
          <li><strong>Supabase</strong> — database, authentication and file storage.</li>
          <li><strong>Vercel</strong> — website hosting and delivery.</li>
          <li><strong>Cloudflare Turnstile</strong> — the "verify you are human" check on sign-up and log-in. It receives technical signals from your browser, not your Campusly profile.</li>
          <li><strong>Our email delivery provider</strong> — to send confirmation, password-reset and notification emails.</li>
        </LegalList>
        <p>
          We may also disclose data if the law requires it, if we must protect someone's safety, or
          as part of a handover of the project to a new operator (with this policy still applying).
        </p>
      </LegalSection>

      <LegalSection id="where" title="6. Where your data is stored, and moderation">
        <p>
          Data is stored on Supabase infrastructure, which may be located outside India. Where data
          leaves India, we rely on the provider's contractual safeguards and standard data-protection
          terms.
        </p>
        <p>
          Admins can see reports, moderation queues and confession authorship. They cannot read
          private conversations through the app, and they only access data when investigating a
          report or a legal request.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="7. How long we keep it">
        <LegalList>
          <li>Your account and profile: until you delete your account.</li>
          <li>Messages and posts: until you delete them, or your account is deleted.</li>
          <li>Approved confessions: hidden from the feed after 12 hours; a moderation record may be kept to enforce our rules.</li>
          <li>Reports and moderation records: kept while needed to keep the community safe and to handle appeals.</li>
          <li>Backups: deleted data may remain in encrypted backups for a short period, typically up to 30 days.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="security" title="8. How we protect it">
        <p>
          Every database table has row-level security so students can only read and change their own
          data; private files are served through short-lived signed links; the app uses only a public
          API key and never a service-role secret; passwords are handled by Supabase and are never
          stored in plain text. No service is perfectly secure, so please use a strong password and
          do not share sensitive information in public posts.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="9. Your rights">
        <p>Under the DPDP Act you can ask to:</p>
        <LegalList>
          <li>see a summary of the personal data we hold about you and how it is processed;</li>
          <li>correct or complete inaccurate data (most of it is editable in your profile);</li>
          <li>delete your data;</li>
          <li>withdraw consent;</li>
          <li>nominate someone to exercise your rights if you cannot.</li>
        </LegalList>
        <p>
          The fastest way to delete everything is <strong>Settings → Delete my account</strong> in the
          app. It permanently removes your profile, photos, messages, posts and achievements. You can
          also write to <a className="font-semibold text-forest underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
          and we will help. We aim to respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection id="children" title="10. Age">
        <p>
          {APP_NAME} is for students aged 18 and over. If you are under 18, please do not sign up
          without a parent or guardian's consent. If we learn that someone under 18 signed up without
          consent, we will close the account.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="11. Cookies and local storage">
        <p>
          We do not use advertising or analytics cookies. We store your login session and your theme
          and sidebar preferences in your browser. Clearing site data logs you out and resets those
          preferences.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to this policy">
        <p>
          If we change how the app handles data, we will update this page, change the date at the top,
          and — for important changes — show a notice in the app before the change takes effect.
        </p>
      </LegalSection>

      <LegalSection id="grievance" title="13. Grievance redressal">
        <p>
          For privacy questions or complaints, contact our grievance officer:
        </p>
        <p className="rounded-2xl border border-line bg-surface/70 px-4 py-3">
          <strong>{GRIEVANCE_OFFICER}</strong><br />
          <a className="font-semibold text-forest underline" href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a>
        </p>
        <p>
          If you are not satisfied with our response, you may complain to the Data Protection Board
          of India.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
