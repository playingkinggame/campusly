import { campuslyOriginal } from './definitions/campusly-original';
import { darkAmethyst } from './definitions/dark-amethyst';
import { graphiteLime } from './definitions/graphite-lime';
import { midnightAurora } from './definitions/midnight-aurora';
import { midnightOcean } from './definitions/midnight-ocean';
import { obsidianEmerald } from './definitions/obsidian-emerald';
import { THEME_IDS, type ColorScheme, type PaletteKey, type ThemeDefinition, type ThemeId, type ThemeMode, type ThemePalette } from './types';

/** Shown in the Appearance & Themes grid, in this order. */
export const THEMES: readonly ThemeDefinition[] = [
  midnightAurora,
  midnightOcean,
  obsidianEmerald,
  darkAmethyst,
  graphiteLime,
  campuslyOriginal,
];

/** New accounts, accounts with no saved choice, and "Reset to default". */
export const DEFAULT_THEME_ID: ThemeId = 'midnight-aurora';

/** Device cache (the account row is the source of truth; this only avoids a flash on load). */
export const STORAGE_KEY_THEME = 'campusly-theme-id';
/** Light / Dark / Auto for Campusly Original. Same key the app used before themes existed. */
export const STORAGE_KEY_MODE = 'campusly-theme';

const BY_ID = new Map<ThemeId, ThemeDefinition>(THEMES.map((t) => [t.id, t]));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getTheme(id: ThemeId): ThemeDefinition {
  return BY_ID.get(id) ?? (BY_ID.get(DEFAULT_THEME_ID) as ThemeDefinition);
}

/** Dark-only themes always resolve to dark; Campusly Original follows its Light / Dark / Auto mode. */
export function resolveScheme(theme: ThemeDefinition, mode: ThemeMode, systemIsDark: boolean): ColorScheme {
  if (!theme.adaptive) return 'dark';
  if (mode === 'system') return systemIsDark ? 'dark' : 'light';
  return mode;
}

export function getPalette(theme: ThemeDefinition, scheme: ColorScheme): ThemePalette {
  return (scheme === 'light' ? theme.palettes.light : undefined) ?? theme.palettes.dark;
}

export const ALL_PALETTES: readonly ThemePalette[] = THEMES.flatMap((t) =>
  t.palettes.light ? [t.palettes.light, t.palettes.dark] : [t.palettes.dark],
);

export function paletteKeyFor(id: ThemeId, mode: ThemeMode, systemIsDark: boolean): PaletteKey {
  const theme = getTheme(id);
  return getPalette(theme, resolveScheme(theme, mode, systemIsDark)).key;
}
