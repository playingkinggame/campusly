/**
 * Cloudflare Turnstile — public site key only.
 *
 * The SECRET key lives in Supabase (Authentication -> Bot and Abuse Protection),
 * never in this project. When this value is empty the widget is not shown and
 * no token is sent; that is fine for local development if CAPTCHA is disabled
 * in Supabase. Once CAPTCHA is enabled in Supabase, this key MUST be set or
 * sign-up / sign-in / password-reset requests will be rejected.
 *
 * Set VITE_TURNSTILE_SITE_KEY in .env.local and in Vercel.
 */
const raw = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export const TURNSTILE_SITE_KEY = typeof raw === 'string' ? raw.trim() : '';
export const captchaEnabled = TURNSTILE_SITE_KEY.length > 0;
