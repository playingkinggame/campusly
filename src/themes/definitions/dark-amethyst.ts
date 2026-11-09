import { defineDarkPalette } from '../define';
import type { ThemeDefinition } from '../types';

export const darkAmethyst: ThemeDefinition = {
  id: 'dark-amethyst',
  name: 'Dark Amethyst',
  description: 'Rich violet softened with pink.',
  adaptive: false,
  palettes: {
    dark: defineDarkPalette({
      key: 'dark-amethyst',
      background: '#100B16',
      sidebar: '#170F20',
      card: '#20152B',
      elevated: '#2A1B38',
      primary: '#C084FC',
      secondary: '#F472B6',
      text: '#FAF5FF',
      textMuted: '#B3A2BE',
    }),
  },
};
