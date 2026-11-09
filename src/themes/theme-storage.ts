import { DEFAULT_THEME_ID, STORAGE_KEY_MODE, STORAGE_KEY_THEME, isThemeId, isThemeMode } from './theme-config';
import type { ThemeId, ThemeMode } from './types';

/** Device-level cache. Every call is wrapped because storage can be blocked (private mode, policies). */
export function readCachedThemeId(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY_THEME);
    if (isThemeId(v)) return v;
  } catch { /* storage blocked: use the default */ }
  return DEFAULT_THEME_ID;
}

export function writeCachedThemeId(id: ThemeId): void {
  try { localStorage.setItem(STORAGE_KEY_THEME, id); } catch { /* ignore */ }
}

export function readCachedMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY_MODE);
    if (isThemeMode(v)) return v;
  } catch { /* ignore */ }
  return 'system';
}

export function writeCachedMode(mode: ThemeMode): void {
  try { localStorage.setItem(STORAGE_KEY_MODE, mode); } catch { /* ignore */ }
}
