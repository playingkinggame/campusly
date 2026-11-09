import { useLayoutEffect, type ReactNode } from 'react';
import { useAuth } from '@/store/authStore';
import { useTheme } from '@/store/themeStore';

/**
 * Keeps the on-screen theme in step with the signed-in account.
 *
 * - Once the profile has loaded, the account's saved theme is applied (it beats the device cache).
 * - `profile.theme` is null/unknown  -> Midnight Aurora (accounts that never chose).
 * - `profile.theme` is undefined     -> the migration has not been run yet, so keep the device theme.
 *
 * Everything else (applying, caching, saving) lives in the theme store, so this component renders
 * nothing of its own and never causes the tree below it to re-render.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const userId = useAuth((s) => s.userId);
  const hasProfile = useAuth((s) => s.profile !== null);
  const saved = useAuth((s) => s.profile?.theme);
  const applyFromAccount = useTheme((s) => s.applyFromAccount);

  // Layout effect: runs before the browser paints, so the app shell never appears in the wrong theme.
  useLayoutEffect(() => {
    if (!userId || !hasProfile || saved === undefined) return;
    applyFromAccount(saved);
  }, [userId, hasProfile, saved, applyFromAccount]);

  return <>{children}</>;
}
