import { useEffect, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY } from '@/lib/captcha';

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'auto' | 'light' | 'dark';
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      'timeout-callback'?: () => void;
    },
  ) => string;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<void> | null = null;

/** Loads Cloudflare's script once; later mounts reuse it. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const markFailed = () => reject(new Error('Turnstile could not load'));
    const existing = document.querySelector<HTMLScriptElement>('script[data-campusly-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', markFailed, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.campuslyTurnstile = 'true';
    script.onload = () => resolve();
    script.onerror = markFailed;
    document.head.appendChild(script);
  });
  return loader;
}

interface Props {
  /** Called with the token when the check passes, and with null when it expires or errors. */
  onToken: (token: string | null) => void;
  className?: string;
}

/**
 * The bot check shown above sign-up, log-in and password-reset buttons.
 * Tokens are single-use: remount with a new `key` after every attempt.
 */
export function TurnstileWidget({ onToken, className = '' }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const tokenFn = useRef(onToken);
  tokenFn.current = onToken;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;

    const mount = () => {
      if (!alive) return;
      // The script can finish loading slightly before window.turnstile exists.
      if (!window.turnstile) {
        if (tries++ < 40) timer = setTimeout(mount, 150);
        else setFailed(true);
        return;
      }
      if (!box.current) return;
      widgetId.current = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'auto',
        callback: (token: string) => tokenFn.current(token),
        'expired-callback': () => tokenFn.current(null),
        'timeout-callback': () => tokenFn.current(null),
        'error-callback': () => {
          tokenFn.current(null);
          setFailed(true);
        },
      });
    };

    loadTurnstile().then(mount).catch(() => { if (alive) setFailed(true); });

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <div className={className}>
      <div ref={box} className="flex min-h-[65px] justify-center" />
      {failed && (
        <p role="alert" className="text-center text-xs text-danger-ink">
          The verification could not load. Turn off any ad blocker and reload the page.
        </p>
      )}
    </div>
  );
}
