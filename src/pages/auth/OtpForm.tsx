import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { friendlyError } from '@/lib/errors';
import { cleanEmail, sendOtp, verifyOtp } from '@/lib/api/auth';
import { isVitEmail } from '@/lib/utils';
import { VIT_EMAIL_DOMAIN } from '@/lib/constants';

/** Two steps: type your VIT email -> type the code we email you. Used by Login and Sign up. */
export function OtpForm({ mode }: { mode: 'login' | 'signup' }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!isVitEmail(email)) { setError(`Use your VIT student email (ends with ${VIT_EMAIL_DOMAIN}).`); return; }
    setBusy(true);
    try {
      await sendOtp(email, mode);
      setStep('code');
      setCooldown(30);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) { setError('Enter the code from your email (6 or more digits).'); return; }
    setBusy(true);
    try {
      await verifyOtp(email, code);
      // The auth listener in the store takes over and the router moves us on.
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={send} noValidate className="space-y-4">
        <Input
          label="VIT student email" type="email" required autoComplete="email" inputMode="email"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`yourname${VIT_EMAIL_DOMAIN}`}
          error={error} hint={error ? undefined : 'We will email you a one-time code. No password needed.'}
        />
        <Button type="submit" size="lg" loading={busy} className="w-full">
          <Mail className="h-4 w-4" aria-hidden="true" /> Send me a code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} noValidate className="space-y-4">
      <p className="rounded-2xl bg-mint/60 px-4 py-3 text-sm text-forest">
        We sent a code to <strong>{cleanEmail(email)}</strong>. It may take a minute. Check spam too.
      </p>
      <Input
        ref={codeRef} label="Code from your email" required inputMode="numeric" autoComplete="one-time-code" maxLength={10}
        value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={error}
        className="text-center text-xl tracking-[0.35em]" placeholder="123456"
      />
      <Button type="submit" size="lg" loading={busy} className="w-full">{mode === 'signup' ? 'Create my account' : 'Log in'}</Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null); }}
          className="inline-flex items-center gap-1 font-semibold text-forest hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Change email
        </button>
        <button type="button" disabled={cooldown > 0 || busy} onClick={() => void send()}
          className="font-semibold text-forest hover:underline disabled:text-muted disabled:no-underline">
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
