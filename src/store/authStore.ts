import { create } from 'zustand';
import { supabase, isConfigured } from '@/lib/supabase';
import { friendlyError } from '@/lib/errors';
import { checkIsAdmin, getMyProfile } from '@/lib/api/profiles';
import { signOut as apiSignOut } from '@/lib/api/auth';
import { useUnread } from './unreadStore';
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
  signOut: () => Promise<void>;
}

let started = false;

export const useAuth = create<AuthState>((set, get) => {
  async function loadFor(userId: string, email: string | null) {
    try {
      const profile = await getMyProfile(userId);
      if (!profile) throw new Error('Profile not found');
      const isAdmin = profile.onboarded ? await checkIsAdmin() : false;
      set({ status: profile.onboarded ? 'ready' : 'needs_onboarding', userId, email, profile, isAdmin, error: null });
    } catch (e) {
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

      supabase.auth.getSession().then(({ data }) => {
        const s = data.session;
        if (s) void loadFor(s.user.id, s.user.email ?? null);
        else set({ status: 'signed_out' });
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

    signOut: async () => {
      await apiSignOut();
    },
  };
});
