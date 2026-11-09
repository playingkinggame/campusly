/** Stable identifiers. These exact strings are what gets stored in `profiles.theme`. */
export const THEME_IDS = [
  'midnight-aurora',
  'midnight-ocean',
  'obsidian-emerald',
  'dark-amethyst',
  'graphite-lime',
  'campusly-original',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** One concrete set of colours. Campusly Original has two (light + dark); every other theme has one. */
export type PaletteKey =
  | 'midnight-aurora'
  | 'midnight-ocean'
  | 'obsidian-emerald'
  | 'dark-amethyst'
  | 'graphite-lime'
  | 'campusly-original-light'
  | 'campusly-original-dark';

export type ColorScheme = 'light' | 'dark';

/** Light / Dark / Auto. Only Campusly Original uses it; the other five themes are dark-only. */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Every CSS variable a theme must provide. Tailwind utilities (bg-cream, text-forest, ...) read the
 * `--color-*` variables, so every component picks up a theme automatically.
 *
 *   --color-cream        page background            (--background)
 *   --color-sidebar      sidebar background         (--sidebar-background)
 *   --color-surface      cards, inputs, menus       (--card-background)
 *   --color-elevated     raised cards, popovers     (--card-elevated)
 *   --color-forest       primary accent for text    (--primary-accent)
 *   --color-accent-2     secondary accent           (--secondary-accent)
 *   --color-knob         switch handle (off state)
 *   --color-ink          primary text               (--primary-text)
 *   --color-muted        secondary text             (--secondary-text)
 *   --color-line         borders                    (--border-color)
 *   --color-hover        hover background           (--hover-background)
 *   --color-success / --color-warn-ink / --color-danger   (--success-color / --warning-color / --danger-color)
 */
export const TOKEN_NAMES = [
  '--color-cream',
  '--color-sidebar',
  '--color-surface',
  '--color-elevated',
  '--color-forest',
  '--color-forest-600',
  '--color-forest-900',
  '--color-brand',
  '--color-brand-600',
  '--color-on-brand',
  '--color-knob',
  '--color-accent-2',
  '--color-highlight',
  '--color-mint',
  '--color-mint-300',
  '--color-ink',
  '--color-muted',
  '--color-line',
  '--color-hover',
  '--color-success',
  '--color-danger',
  '--color-danger-ink',
  '--color-danger-soft',
  '--color-warn-soft',
  '--color-warn-ink',
  '--glass-bg',
  '--glass-border',
  '--glass-shadow',
  '--accent-glow',
] as const;
export type TokenName = (typeof TOKEN_NAMES)[number];
export type ThemeTokens = Record<TokenName, string>;

/** Raw colours used to draw the miniature preview on a theme card. */
export interface ThemePreview {
  background: string;
  sidebar: string;
  card: string;
  elevated: string;
  accent: string;
  accent2: string;
  text: string;
  textMuted: string;
}

export interface ThemePalette {
  key: PaletteKey;
  scheme: ColorScheme;
  /** Colour of the phone / browser address bar (<meta name="theme-color">). */
  browserColor: string;
  tokens: ThemeTokens;
  preview: ThemePreview;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  /** true = has a light and a dark palette and honours Light / Dark / Auto. */
  adaptive: boolean;
  palettes: { dark: ThemePalette; light?: ThemePalette };
}
