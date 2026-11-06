import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { AppError, friendlyError } from '../errors';
import { isVitEmail } from '../utils';
import { VIT_EMAIL_DOMAIN } from '../constants';

export function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Step 1: email a one-time code. "login" never creates accounts; "signup" may. */
export async function sendOtp(email: string, mode: 'login' | 'signup'): Promise<void> {
  const e = cleanEmail(email);
  if (!isVitEmail(e)) throw new AppError(`Use your VIT student email (ends with ${VIT_EMAIL_DOMAIN}).`);
  const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: mode === 'signup' } });
  if (error) throw new AppError(friendlyError(error));
}

/** Step 2: check the code. */
export async function verifyOtp(email: string, code: string): Promise<Session> {
  const { data, error } = await supabase.auth.verifyOtp({ email: cleanEmail(email), token: code.trim(), type: 'email' });
  if (error || !data.session) throw new AppError(friendlyError(error ?? { message: 'invalid token' }));
  return data.session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** The signed-in user's id, or a friendly error. */
export async function requireUserId(): Promise<string> {
  const s = await getSession();
  if (!s) throw new AppError('Your session expired. Please log in again.');
  return s.user.id;
}
