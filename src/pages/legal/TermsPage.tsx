import { LegalLayout, LegalSection, LegalList } from './LegalLayout';
import {
  APP_NAME, CONTACT_EMAIL, GOVERNING_CITY, OPERATOR,
} from '@/lib/legal';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro={`These Terms are the agreement between you and ${OPERATOR} for using ${APP_NAME}. By creating an account or using the app, you agree to them. Please also read our Privacy Policy, which explains how we handle your data.`}
    >
      <LegalSection id="acceptance" title="1. Accepting these Terms">
        <p>
          You agree to these Terms by ticking the box at sign-up or by using {APP_NAME}. If you do not
          agree, please do not use the app. You must also follow any rules shown inside the app, such
          as reporting guidance and group rules.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Who can use Campusly">
        <LegalList>
          <li>You must be a current VIT student with a working <strong>@vitstudent.ac.in</strong> email address.</li>
          <li>You must be at least 18 years old, or have a parent or guardian's consent.</li>
          <li>You may keep only one account, and the details you give (name, registration number, batch) must be accurate and yours.</li>
          <li>{APP_NAME} is a student-run project. It is not an official VIT service, and VIT does not endorse or operate it.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="account" title="3. Your account and security">
        <LegalList>
          <li>Keep your password private and do not let anyone else use your account.</li>
          <li>You are responsible for activity that happens through your account.</li>
          <li>Tell us immediately if you think your account has been compromised.</li>
          <li>We may ask you to re-verify your VIT email if the domain or your student status changes.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="use" title="4. Acceptable use">
        <p>Do not use {APP_NAME} to:</p>
        <LegalList>
          <li>harass, threaten, bully, stalk or intimidate anyone, including through anonymous confessions;</li>
          <li>post hate speech, sexual content involving minors, non-consensual intimate images, or content that is illegal in India;</li>
          <li>impersonate another person, a student group or the university;</li>
          <li>share someone's private information — room number, phone number, photos, chats — without their permission;</li>
          <li>spam, run bots or scripts, scrape the app, or attempt to bypass rate limits, CAPTCHA or upload limits;</li>
          <li>upload malware, or files that are not yours to share;</li>
          <li>sell, advertise or run commercial activity without our permission;</li>
          <li>interfere with the app's security or with other students' use of it.</li>
        </LegalList>
        <p>
          Academic collaboration is welcome, but sharing exam papers, answers or other material that
          breaks VIT's academic-integrity rules is your responsibility, not ours.
        </p>
      </LegalSection>

      <LegalSection id="content" title="5. Your content">
        <LegalList>
          <li>You keep ownership of the photos, messages and posts you create.</li>
          <li>
            You give us a non-exclusive, worldwide licence to store, copy, display and deliver that
            content only as needed to run {APP_NAME} — for example, showing your photo on your
            profile or delivering a message to the people in a conversation.
          </li>
          <li>You confirm you have the right to share what you upload, and that it does not break anyone else's rights.</li>
          <li>Deleting content removes it from the app; copies may remain in backups for a short period (see the Privacy Policy).</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="confessions" title="6. Confessions and anonymity">
        <p>
          Confessions are shown without your name to other students, but they are not anonymous to
          the moderation team: admins can see the author when reviewing a report or a confession.
          Do not use confessions to reveal someone else's identity or private information, and do not
          treat anonymity as a shield for abuse. Confessions are moderated before they appear and are
          hidden from the feed 12 hours after approval.
        </p>
      </LegalSection>

      <LegalSection id="campus" title="7. Campus boards and meeting people">
        <p>
          Events, teammate posts, rides, study rooms and lost &amp; found are created by students. We
          do not organise, verify or supervise them. Use your judgement before meeting someone in
          person, and follow campus safety rules. Report anything that feels unsafe.
        </p>
      </LegalSection>

      <LegalSection id="moderation" title="8. Moderation and termination">
        <LegalList>
          <li>We may remove content or restrict features that break these Terms or put students at risk.</li>
          <li>We may suspend or close an account for serious or repeated violations, for fake accounts, or where the law requires it.</li>
          <li>Where reasonable, we will tell you why and give you a way to appeal by email.</li>
          <li>You can stop using the app at any time and delete your account yourself.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="deletion" title="9. Deleting your account">
        <p>
          Go to <strong>Settings → Delete my account</strong>, type DELETE to confirm, and your
          account and data are permanently removed. This cannot be undone. If you cannot log in, write
          to <a className="font-semibold text-forest underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
          and we will help verify and delete it.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="10. Third-party services">
        <p>
          We use Supabase, Vercel, Cloudflare Turnstile and an email provider to run the app. Links
          to other websites are not covered by these Terms, and their own terms apply.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="11. Disclaimers">
        <p>
          {APP_NAME} is provided "as is" and "as available". It is a student project, so it may have
          bugs, downtime or lose features. We do not promise that content posted by students is
          accurate, and we do not provide academic, legal, medical or safety advice. Nothing here
          limits rights you have under Indian consumer or data-protection law.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="12. Limitation of liability">
        <p>
          To the fullest extent allowed by law, {OPERATOR} is not liable for indirect or
          consequential losses, or for losses caused by content posted by other students, by meetings
          arranged through the app, or by events outside our reasonable control. Where liability
          cannot be excluded, our total liability is limited to the amount you paid us in the previous
          12 months — {APP_NAME} is free, so that is zero.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="13. Your responsibility">
        <p>
          If your content or your use of the app causes a claim against us, you agree to cover the
          reasonable costs of defending it. This does not apply where the claim is caused by our own
          breach of these Terms or of the law.
        </p>
      </LegalSection>

      <LegalSection id="law" title="14. Governing law">
        <p>
          These Terms are governed by the laws of India. Courts in {GOVERNING_CITY} have exclusive
          jurisdiction, except where Indian law gives you the right to go to another forum.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="15. Changes to these Terms">
        <p>
          We may update these Terms as the app changes. The date at the top of this page shows the
          current version. For important changes we will give notice in the app before they take
          effect. Continuing to use {APP_NAME} after that means you accept the new Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="16. Contact">
        <p>
          Questions, reports or appeals:{' '}
          <a className="font-semibold text-forest underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          We are a small student team, so please be patient — we aim to reply within 30 days.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
