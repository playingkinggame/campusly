import type { ThemeDefinition, ThemePalette, ThemeTokens } from '../types';

/**
 * Campusly Original: the app's look before themes existed. Every value below is copied verbatim
 * from the old src/index.css (light tokens and the [data-theme='dark'] block), so nothing shifts.
 * Tokens that did not exist back then (sidebar, elevated, hover, highlight, success...) are set to
 * what the app was already rendering, e.g. the old sidebar was `bg-surface/50` over the page colour.
 */
const light: ThemeTokens = {
  '--color-cream': '#F5F8EF',
  '--color-sidebar': '#FAFCF7', // old: surface (#FFFFFF) at 50% over cream
  '--color-surface': '#FFFFFF',
  '--color-elevated': '#FFFFFF',
  '--color-forest': '#08482D',
  '--color-forest-600': '#0C5C3A',
  '--color-forest-900': '#052E1D',
  '--color-brand': '#08482D',
  '--color-brand-600': '#0C5C3A',
  '--color-on-brand': '#FFFFFF',
  '--color-knob': '#FFFFFF',
  '--color-accent-2': '#0C5C3A',
  '--color-highlight': '#4F8A12',
  '--color-mint': '#DAE7C7',
  '--color-mint-300': '#E9F1DC',
  '--color-ink': '#14231B',
  '--color-muted': '#5B6B61',
  '--color-line': '#D6E0C8',
  '--color-hover': '#E3EDD3', // old hover: mint at 70%
  '--color-success': '#22C55E', // old online dot: bg-green-500
  '--color-danger': '#B3261E',
  '--color-danger-ink': '#B3261E',
  '--color-danger-soft': '#FDECEA',
  '--color-warn-soft': '#FEF3C7',
  '--color-warn-ink': '#92400E',
  '--glass-bg': 'rgba(255, 255, 255, 0.66)',
  '--glass-border': 'rgba(8, 72, 45, 0.10)',
  '--glass-shadow': '0 6px 24px -12px rgba(8, 72, 45, 0.25)',
  '--accent-glow': '0 0 0 2px rgba(8, 72, 45, 0.55), 0 0 22px -8px rgba(8, 72, 45, 0.35)',
};

const dark: ThemeTokens = {
  '--color-cream': '#0D1411',
  '--color-sidebar': '#111A15', // old: surface (#151F19) at 50% over cream
  '--color-surface': '#151F19',
  '--color-elevated': '#1A261F',
  '--color-forest': '#8EDBAF',
  '--color-forest-600': '#A6E6C1',
  '--color-forest-900': '#052E1D',
  '--color-brand': '#1F7A4F',
  '--color-brand-600': '#279060',
  '--color-on-brand': '#FFFFFF',
  '--color-knob': '#FFFFFF',
  '--color-accent-2': '#279060',
  '--color-highlight': '#A6E6C1',
  '--color-mint': '#1D3126',
  '--color-mint-300': '#243D2F',
  '--color-ink': '#E8F0EA',
  '--color-muted': '#9DB0A4',
  '--color-line': '#27382E',
  '--color-hover': '#1B2D23', // old hover: mint at 70%
  '--color-success': '#22C55E',
  '--color-danger': '#C2372E',
  '--color-danger-ink': '#FF9D95',
  '--color-danger-soft': '#3B1D1B',
  '--color-warn-soft': '#3A2E12',
  '--color-warn-ink': '#F3CD7A',
  '--glass-bg': 'rgba(21, 31, 25, 0.72)',
  '--glass-border': 'rgba(142, 219, 175, 0.14)',
  '--glass-shadow': '0 6px 24px -12px rgba(0, 0, 0, 0.7)',
  '--accent-glow': '0 0 0 2px rgba(142, 219, 175, 0.55), 0 0 26px -8px rgba(142, 219, 175, 0.4)',
};

const lightPalette: ThemePalette = {
  key: 'campusly-original-light',
  scheme: 'light',
  browserColor: '#08482D',
  tokens: light,
  preview: {
    background: '#F5F8EF', sidebar: '#FAFCF7', card: '#FFFFFF', elevated: '#FFFFFF',
    accent: '#08482D', accent2: '#DAE7C7', text: '#14231B', textMuted: '#5B6B61',
  },
};

const darkPalette: ThemePalette = {
  key: 'campusly-original-dark',
  scheme: 'dark',
  browserColor: '#0D1411',
  tokens: dark,
  preview: {
    background: '#0D1411', sidebar: '#111A15', card: '#151F19', elevated: '#1A261F',
    accent: '#8EDBAF', accent2: '#1F7A4F', text: '#E8F0EA', textMuted: '#9DB0A4',
  },
};

export const campuslyOriginal: ThemeDefinition = {
  id: 'campusly-original',
  name: 'Campusly Original',
  description: 'The classic green look, with light, dark and auto modes.',
  adaptive: true,
  palettes: { light: lightPalette, dark: darkPalette },
};
