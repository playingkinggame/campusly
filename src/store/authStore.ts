import { create } from 'zustand';
import { supabase, isConfigured } from '@/lib/supabase';
import { friendlyError } from '@/lib/errors';
import { checkIsAdmin, getMyProfile } from '@/lib/api/profiles';
import { consumeAuthRedirect, ensureMyProfile, signOut as apiSignOut } from '@/lib/api/auth';
import { useUnread } from './unreadStore';
import { toast } from './uiStore';
import type { MyProfile } from '@/types/db';

export type AuthStatus = 'loading' | 'signed_out' | 'needs_onboarding' | 'ready' | 'error';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  profile: MyProfile | null;
  isAdmin: boolean;
  error: string | null;
  init: () => void;
  reload: () => Promise<void>;
  setProfile: (p: MyProfile) => void;
  /** Merge changed columns into the profile already on screen (used by live updates). */
  patchProfile: (row: Partial<MyProfile>) => void;
  /** Quietly fetch the newest profile (streak, hearts...) without showing a loading screen. */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

let started = false;

export const useAuth = create<AuthState>((set, get) => {
  async function loadFor(userId: string, email: string | null) {
    try {
      let profile = await getMyProfile(userId);
      if (!profile) {
        // account exists but its profile row is missing: create it, then try once more
        await ensureMyProfile();
        profile = await getMyProfile(userId);
      }
      if (!profile) throw new Error('We could not find your profile. Please run supabase/phase4_password_auth.sql, then log in again.');
      const isAdmin = profile.onboarded ? await checkIsAdmin() : false;
      set({ status: profile.onboarded ? 'ready' : 'needs_onboarding', userId, email, profile, isAdmin, error: null });
    } catch (e) {
      console.error('[Campusly] could not load account after sign-in:', e);
      set({ status: 'error', userId, email, error: friendlyError(e) });
    }
  }

  return {
    status: 'loading',
    userId: null,
    email: null,
    profile: null,
    isAdmin: false,
    error: null,

    init: () => {
      if (started) return;
      started = true;
      if (!isConfigured) { set({ status: 'signed_out' }); return; }

      // If the page was opened from an email link (confirm email / reset password), sign in from it first.
      consumeAuthRedirect()
        .catch(() => null)
        .then((redirect) => {
          if (redirect?.kind === 'error') toast.error(redirect.message);
          else if (redirect?.kind === 'confirmed') toast.success('Email confirmed. Welcome to Campusly!');
          return supabase.auth.getSession();
        })
        .then(({ data }) => {
          const s = data.session;
          if (s) {
            // the SIGNED_IN listener below may already have loaded this user
            if (get().status === 'loading') void loadFor(s.user.id, s.user.email ?? null);
          } else set({ status: 'signed_out' });
        });

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          useUnread.getState().reset();
          set({ status: 'signed_out', userId: null, email: null, profile: null, isAdmin: false, error: null });
          return;
        }
        if (event === 'SIGNED_IN' && session.user.id !== get().userId) {
          // run outside the callback (Supabase warns about awaiting inside it)
          setTimeout(() => void loadFor(session.user.id, session.user.email ?? null), 0);
        }
      });
    },

    reload: async () => {
      const { userId, email } = get();
      if (userId) { set({ status: 'loading' }); await loadFor(userId, email); }
    },

    setProfile: (p) => set({ profile: p, status: p.onboarded ? 'ready' : 'needs_onboarding' }),

    patchProfile: (row) => set((s) => (s.profile ? { profile: { ...s.profile, ...row } } : s)),

    refreshProfile: async () => {
      const { userId, status, profile } = get();
      if (!userId || status !== 'ready') return;
      try {
        const fresh = await getMyProfile(userId);
        if (!fresh) return;
        // last_seen_at changes every minute; ignore it so screens do not re-draw for nothing
        const sig = (p: MyProfile | null) => {
          if (!p) return '';
          const { last_seen_at: _a, updated_at: _b, ...rest } = p as MyProfile & { updated_at?: string };
          return JSON.stringify(rest);
        };
        if (sig(fresh) !== sig(profile)) set({ profile: fresh });
      } catch { /* keep showing what we already have */ }
    },

    signOut: async () => {
      await apiSignOut();
    },
  };
});
