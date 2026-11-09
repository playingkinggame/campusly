import { defineDarkPalette } from '../define';
import type { ThemeDefinition } from '../types';

/** Default theme for every new account. */
export const midnightAurora: ThemeDefinition = {
  id: 'midnight-aurora',
  name: 'Midnight Aurora',
  description: 'Purple and electric blue. The Campusly default.',
  adaptive: false,
  palettes: {
    dark: defineDarkPalette({
      key: 'midnight-aurora',
      background: '#090B14',
      sidebar: '#0D1020',
      card: '#14182A',
      elevated: '#1B2036',
      primary: '#A78BFA',
      secondary: '#6366F1',
      highlight: '#38BDF8',
      text: '#F1F5F9',
      textMuted: '#929BB2',
    }),
  },
};
