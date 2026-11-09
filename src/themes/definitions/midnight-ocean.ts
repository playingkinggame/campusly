import { defineDarkPalette } from '../define';
import type { ThemeDefinition } from '../types';

export const midnightOcean: ThemeDefinition = {
  id: 'midnight-ocean',
  name: 'Midnight Ocean',
  description: 'Deep navy with a cool cyan glow.',
  adaptive: false,
  palettes: {
    dark: defineDarkPalette({
      key: 'midnight-ocean',
      background: '#07111F',
      sidebar: '#0A1726',
      card: '#102235',
      elevated: '#163149',
      primary: '#22D3EE',
      secondary: '#38BDF8',
      text: '#EAF6FF',
      textMuted: '#8FA9BE',
    }),
  },
};
