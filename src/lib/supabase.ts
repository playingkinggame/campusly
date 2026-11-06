import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** false when .env is missing; App.tsx then shows a friendly setup screen. */
export const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

// Only the public "anon" key is ever used here. The service-role key must NEVER be in frontend code.
export const supabase = createClient(
  isConfigured ? (url as string) : 'http://localhost:54321',
  isConfigured ? (anonKey as string) : 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // We sign in with a 6-digit code, not a link. Turning this off keeps the
      // HashRouter (#/login) from being confused by auth tokens in the URL hash.
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 20 } },
  },
);
