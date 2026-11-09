import { defineDarkPalette } from '../define';
import type { ThemeDefinition } from '../types';

export const obsidianEmerald: ThemeDefinition = {
  id: 'obsidian-emerald',
  name: 'Obsidian + Emerald',
  description: 'Near-black with a premium green.',
  adaptive: false,
  palettes: {
    dark: defineDarkPalette({
      key: 'obsidian-emerald',
      background: '#090D0B',
      sidebar: '#0D1511',
      card: '#121D17',
      elevated: '#19271F',
      primary: '#34D399',
      secondary: '#6EE7B7',
      text: '#F0FDF4',
      textMuted: '#91A99A',
    }),
  },
};
