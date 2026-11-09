import { mix, rgba } from './color';
import type { PaletteKey, ThemePalette, ThemeTokens } from './types';

interface DarkPaletteInput {
  key: PaletteKey;
  background: string;
  sidebar: string;
  card: string;
  elevated: string;
  primary: string;
  secondary: string;
  /** Third accent for small highlights. Defaults to the secondary accent. */
  highlight?: string;
  text: string;
  textMuted: string;
}

/**
 * Builds a full token set for a dark theme from the handful of colours a designer actually picks.
 * Borders, hover tints and soft chips are derived, so every theme gets the same consistent depth.
 * Filled buttons use the primary accent with the page background as text colour, which keeps
 * contrast high even on light accents such as lime or mint.
 */
export function defineDarkPalette(i: DarkPaletteInput): ThemePalette {
  const line = mix(i.card, i.text, 0.12);
  const tokens: ThemeTokens = {
    '--color-cream': i.background,
    '--color-sidebar': i.sidebar,
    '--color-surface': i.card,
    '--color-elevated': i.elevated,
    '--color-forest': i.primary,
    '--color-forest-600': mix(i.primary, '#FFFFFF', 0.18),
    '--color-forest-900': mix(i.background, '#000000', 0.55),
    '--color-brand': i.primary,
    '--color-brand-600': mix(i.primary, '#FFFFFF', 0.16),
    '--color-on-brand': i.background,
    '--color-knob': i.text,
    '--color-accent-2': i.secondary,
    '--color-highlight': i.highlight ?? i.secondary,
    '--color-mint': mix(i.card, i.primary, 0.16),
    '--color-mint-300': mix(i.card, i.primary, 0.24),
    '--color-ink': i.text,
    '--color-muted': i.textMuted,
    '--color-line': line,
    '--color-hover': mix(i.card, i.primary, 0.12),
    '--color-success': '#4ADE80',
    '--color-danger': '#C2372E',
    '--color-danger-ink': '#FF9D95',
    '--color-danger-soft': mix(i.card, '#EF4444', 0.18),
    '--color-warn-soft': mix(i.card, '#F59E0B', 0.16),
    '--color-warn-ink': '#F3CD7A',
    '--glass-bg': rgba(i.card, 0.92),
    '--glass-border': line,
    '--glass-shadow': '0 8px 28px -14px rgba(0, 0, 0, 0.75)',
    '--accent-glow': `0 0 0 1px ${rgba(i.primary, 0.55)}, 0 0 28px -8px ${rgba(i.primary, 0.5)}`,
  };
  return {
    key: i.key,
    scheme: 'dark',
    browserColor: i.background,
    tokens,
    preview: {
      background: i.background,
      sidebar: i.sidebar,
      card: i.card,
      elevated: i.elevated,
      accent: i.primary,
      accent2: i.secondary,
      text: i.text,
      textMuted: i.textMuted,
    },
  };
}
