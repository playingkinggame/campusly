import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { friendlyError } from '@/lib/errors';
import { captchaEnabled } from '@/lib/captcha';
import { cleanEmail, requestPasswordReset } from '@/lib/api/auth';
import { isVitEmail } from '@/lib/utils';
import { VIT_EMAIL_DOMAIN } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaRound((r) => r + 1);
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    const em = cleanEmail(email);
    if (!isVitEmail(em)) { setError(`Use your VIT student email (ends with ${VIT_EMAIL_DOMAIN}).`); return; }
    if (captchaEnabled && !captchaToken) { setError('Please complete the quick human check below.'); return; }
    setBusy(true);
    try {
      await requestPasswordReset(em, captchaToken ?? undefined);
      setSentTo(em);
      setCooldown(30);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
      resetCaptcha();
    }
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your VIT student email and we will send you a reset link.">
      {sentTo ? (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-2xl bg-mint/60 px-4 py-4 text-sm text-forest">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. It may take a minute. Check spam too.</p>
          </div>
          {error && <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger-ink">{error}</p>}
          <TurnstileWidget key={captchaRound} onToken={setCaptchaToken} />
          <Button variant="secondary" size="lg" className="w-full" loading={busy} disabled={cooldown > 0} onClick={() => void send()}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
          </Button>
        </div>
      ) : (
        <form onSubmit={send} noValidate className="space-y-4">
          <Input
            label="VIT student email" type="email" required autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`yourname${VIT_EMAIL_DOMAIN}`} error={error}
          />
          <TurnstileWidget key={captchaRound} onToken={setCaptchaToken} />
          <Button type="submit" size="lg" loading={busy} className="w-full">
            <Send className="h-4 w-4" aria-hidden="true" /> Send reset link
          </Button>
        </form>
      )}
      <p className="text-center text-sm">
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-forest hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
