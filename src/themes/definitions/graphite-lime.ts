import { defineDarkPalette } from '../define';
import type { ThemeDefinition } from '../types';

export const graphiteLime: ThemeDefinition = {
  id: 'graphite-lime',
  name: 'Graphite + Electric Lime',
  description: 'Bold minimalism: neutral graphite, one sharp accent.',
  adaptive: false,
  palettes: {
    dark: defineDarkPalette({
      key: 'graphite-lime',
      background: '#0B0C0D',
      sidebar: '#111315',
      card: '#171A1C',
      elevated: '#202426',
      primary: '#C4F75E',
      secondary: '#A3E635',
      text: '#F5F7F5',
      textMuted: '#92999A',
    }),
  },
};
