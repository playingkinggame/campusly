/** Turns any error into a short, friendly sentence. UI shows only this text. */
export class AppError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

interface ErrLike { message?: string; code?: string; details?: string; status?: number; name?: string }

export function friendlyError(e: unknown): string {
  if (e instanceof AppError) return e.message;
  const err = (e ?? {}) as ErrLike;
  const msg = String(err.message ?? '');
  const low = msg.toLowerCase();
  const details = String(err.details ?? '').toLowerCase();

  if (low.includes('failed to fetch') || low.includes('networkerror') || low.includes('load failed'))
    return "Can't reach the server. Check your internet and try again.";
  if (low.includes('jwt expired') || low.includes('refresh token') || low.includes('not authenticated'))
    return 'Your session expired. Please log in again.';

  // Sign-in / OTP
  if (low.includes('database error saving new user') || low.includes('vitstudent'))
    return 'Only @vitstudent.ac.in email addresses can join Campusly.';
  if (low.includes('signups not allowed') || low.includes('user not found'))
    return 'No account found for this email. Please sign up first.';
  if (low.includes('token has expired') || low.includes('otp') && low.includes('invalid') || low.includes('invalid token'))
    return 'That code is wrong or has expired. Check it or ask for a new one.';
  if (low.includes('rate limit') || low.includes('too many requests') || err.status === 429)
    return 'Too many tries. Please wait a minute and try again.';

  // Uploads / storage
  if (low.includes('bucket not found'))
    return 'Uploads are not set up yet. Please ask the admin to run the storage setup.';
  if (low.includes('payload too large') || low.includes('file size limit'))
    return 'That file is too big.';
  if (low.includes('mime type'))
    return 'That file type is not allowed.';

  // Database rules
  if (err.code === '23505' || low.includes('duplicate key')) {
    if (low.includes('profiles_username') || details.includes('username')) return 'That username is already taken.';
    if (low.includes('profiles_reg_no') || details.includes('reg_no')) return 'That registration number is already registered.';
    if (low.includes('hearts_once')) return 'You already gave this person a heart this week.';
    if (low.includes('connections_pair')) return 'You already have a request or connection with this person.';
    if (low.includes('reports_reporter') || (details.includes('reports') && low.includes('unique'))) return 'You already reported this. Our team will review it.';
    if (low.includes('blocks_pkey') || (details.includes('blocks') && low.includes('unique'))) return 'You already blocked this person.';
    return 'That already exists.';
  }
  if (low.includes('slow down')) return msg;
  if (low.includes('within 10 minutes')) return msg;
  if (err.code === '42501' || low.includes('row-level security') || low.includes('permission denied'))
    return "You're not allowed to do that.";
  if (err.code === '23514' || low.includes('violates check constraint')) {
    if (low.includes('achievements_file_owner')) return 'That file must be uploaded from your own account.';
    if (low.includes('profiles_reg_no')) return 'Registration number looks wrong. Example: 23BCE1001';
    if (low.includes('profiles_username')) return 'Username must be 3 to 20 letters, numbers or underscores.';
    if (low.includes('profiles_link')) return 'The link must start with http:// or https://';
    return 'Some value is not allowed. Please check what you typed.';
  }
  if (err.code === 'P0001' && msg) return msg;           // our own friendly RAISE EXCEPTION texts
  if (msg && msg.length < 160 && !low.includes('relation') && !low.includes('syntax')) return msg;
  return 'Something went wrong. Please try again.';
}

/** Throws a friendly AppError if Supabase returned an error; otherwise returns data. */
export function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) {
    const raw = res.error as ErrLike;
    throw new AppError(friendlyError(res.error), raw.code);
  }
  return res.data as T;
}

export function toAppError(e: unknown): AppError {
  return e instanceof AppError ? e : new AppError(friendlyError(e), (e as ErrLike)?.code);
}
