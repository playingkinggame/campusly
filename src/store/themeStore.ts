import { create } from 'zustand';
import { useAuth } from '@/store/authStore';
import { toast } from '@/store/uiStore';
import { saveThemePreference } from '@/lib/api/profiles';
import {
  DEFAULT_THEME_ID, STORAGE_KEY_MODE, STORAGE_KEY_THEME, getPalette, getTheme, isThemeId, resolveScheme,
} from '@/themes/theme-config';
import { readCachedMode, readCachedThemeId, writeCachedMode, writeCachedThemeId } from '@/themes/theme-storage';
import type { ColorScheme, PaletteKey, ThemeId, ThemeMode, ThemePalette } from '@/themes/types';

/**
 * Theme state. Three layers, in order of authority:
 *   1. the account (profiles.theme)  - source of truth, applied once the profile has loaded
 *   2. this device (localStorage)    - cache so the right theme shows before the profile arrives
 *   3. the default (Midnight Aurora) - new users and accounts with no saved choice
 * Changing theme only flips <html data-theme>; CSS does the rest, so nothing re-renders or reloads.
 */

const systemIsDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let transitionTimer: ReturnType<typeof setTimeout> | undefined;

/** Writes the palette onto the page. `animate` fades colours over ~250ms (not used on first paint). */
function paint(palette: ThemePalette, animate: boolean) {
  const root = document.documentElement;
  if (animate && !prefersReducedMotion()) {
    root.classList.add('theme-transition');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 320);
  }
  root.setAttribute('data-theme', palette.key);
  root.style.colorScheme = palette.scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.browserColor);
}

interface ThemeState {
  themeId: ThemeId;
  /** Light / Dark / Auto. Only affects Campusly Original. */
  mode: ThemeMode;
  /** The light/dark scheme currently on screen. */
  scheme: ColorScheme;
  paletteKey: PaletteKey;
  /** User picks a theme: applies now, caches on this device, saves to the account. */
  selectTheme: (id: ThemeId) => void;
  resetToDefault: () => void;
  setMode: (mode: ThemeMode) => void;
  /** Sun/moon button (Campusly Original only). */
  toggle: () => void;
  /** Adopts the account's saved theme. Never writes back to the database. */
  applyFromAccount: (saved: unknown) => void;
}

function derive(themeId: ThemeId, mode: ThemeMode) {
  const theme = getTheme(themeId);
  const scheme = resolveScheme(theme, mode, systemIsDark());
  const palette = getPalette(theme, scheme);
  return { palette, scheme: palette.scheme, paletteKey: palette.key };
}

const initialId = readCachedThemeId();
const initialMode = readCachedMode();
const initialDerived = derive(initialId, initialMode);

export const useTheme = create<ThemeState>((set, get) => {
  function commit(themeId: ThemeId, mode: ThemeMode, animate: boolean) {
    const { palette, scheme, paletteKey } = derive(themeId, mode);
    paint(palette, animate);
    const cur = get();
    if (cur.themeId !== themeId || cur.mode !== mode || cur.paletteKey !== paletteKey) {
      set({ themeId, mode, scheme, paletteKey });
    }
  }
  function choose(id: ThemeId, isReset: boolean) {
    const changed = get().themeId !== id;
    writeCachedThemeId(id);
    commit(id, get().mode, true);
    if (!changed && !isReset) return;
    queueSave(id, isReset);
  }

  return {
    themeId: initialId,
    mode: initialMode,
    scheme: initialDerived.scheme,
    paletteKey: initialDerived.paletteKey,

    selectTheme: (id) => choose(id, false),
    resetToDefault: () => choose(DEFAULT_THEME_ID, true),

    setMode: (mode) => {
      writeCachedMode(mode);
      commit(get().themeId, mode, true);
    },
    toggle: () => {
      const { themeId, scheme } = get();
      if (!getTheme(themeId).adaptive) return;
      get().setMode(scheme === 'dark' ? 'light' : 'dark');
    },
    applyFromAccount: (saved) => {
      // A save of the user's own is still in flight: their latest click is newer than what we read.
      if (queued || saving) return;
      const id = isThemeId(saved) ? saved : DEFAULT_THEME_ID;
      writeCachedThemeId(id);
      commit(id, get().mode, false);
    },
  };
});

/* ---------- saving to the account ----------
   Saves run one at a time. If the user clicks A, B, C quickly, only the newest value is written
   after the one in flight finishes, so the database always ends up with their last choice. */
let queued: { id: ThemeId; isReset: boolean } | null = null;
let saving = false;

function queueSave(id: ThemeId, isReset: boolean) {
  if (!useAuth.getState().userId) return; // not signed in: device cache only
  queued = { id, isReset };
  void flush();
}

async function flush() {
  if (saving) return;
  saving = true;
  let last: { id: ThemeId; isReset: boolean } | null = null;
  try {
    while (queued) {
      const job = queued;
      queued = null;
      const userId = useAuth.getState().userId;
      if (!userId) break;
      await saveThemePreference(userId, job.id);
      useAuth.setState((s) => (s.profile ? { profile: { ...s.profile, theme: job.id } } : {}));
      last = job;
    }
    if (last) {
      const name = getTheme(last.id).name;
      toast.success(last.isReset ? `Reset to ${name}.` : `${name} saved to your account.`);
    }
  } catch (e) {
    console.error('[Campusly] could not save theme:', e);
    queued = null;
    toast.error('Could not save your theme to your account. It is applied on this device only.');
  } finally {
    saving = false;
  }
}

/** Call once at start-up (before React renders). Paints the theme and follows device / other-tab changes. */
export function initTheme() {
  const { themeId, mode } = useTheme.getState();
  paint(derive(themeId, mode).palette, false);

  // "Auto" mode for Campusly Original follows the device's light/dark setting live.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const s = useTheme.getState();
    if (s.mode === 'system' && getTheme(s.themeId).adaptive) s.setMode('system');
  });

  // Another tab on this device changed theme or mode.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY_THEME && event.key !== STORAGE_KEY_MODE) return;
    const id = readCachedThemeId();
    const m = readCachedMode();
    const { palette, scheme, paletteKey } = derive(id, m);
    paint(palette, true);
    useTheme.setState({ themeId: id, mode: m, scheme, paletteKey });
  });
}
