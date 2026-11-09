import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { getPalette } from '@/themes/theme-config';
import { cn } from '@/lib/utils';
import type { ColorScheme, ThemeDefinition, ThemePreview } from '@/themes/types';

/** A tiny app screen drawn in the theme's own colours (sidebar, header, cards, button). */
function MiniApp({ p }: { p: ThemePreview }) {
  const bar = (w: string, o = 1, c = p.text) => <span className="block h-1 rounded-full" style={{ width: w, background: c, opacity: o }} />;
  return (
    <div className="flex h-full w-full" style={{ background: p.background }} aria-hidden="true">
      <div className="flex w-[27%] flex-col gap-1.5 p-2" style={{ background: p.sidebar, borderRight: `1px solid ${p.elevated}` }}>
        <span className="mb-1 block h-2.5 w-2.5 rounded-[3px]" style={{ background: p.accent }} />
        <span className="block h-2 rounded-[4px]" style={{ background: p.accent, opacity: 0.95 }} />
        {bar('85%', 0.35, p.textMuted)}
        {bar('70%', 0.35, p.textMuted)}
        {bar('78%', 0.35, p.textMuted)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <div className="flex items-center justify-between">
          {bar('34%', 0.9)}
          <span className="block h-2.5 w-2.5 rounded-full" style={{ background: p.accent2 }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-1 rounded-md p-1.5" style={{ background: p.card, border: `1px solid ${p.elevated}` }}>
            {bar('70%', 0.85)}
            {bar('45%', 0.5, p.textMuted)}
          </div>
          <div className="space-y-1 rounded-md p-1.5" style={{ background: p.elevated }}>
            {bar('55%', 0.85)}
            <span className="block h-1 w-1/3 rounded-full" style={{ background: p.accent }} />
          </div>
        </div>
        <div className="flex flex-1 items-end justify-between gap-2 rounded-md p-1.5" style={{ background: p.card, border: `1px solid ${p.elevated}` }}>
          <div className="w-1/2 space-y-1">
            {bar('90%', 0.8)}
            {bar('60%', 0.4, p.textMuted)}
          </div>
          <span className="block h-2.5 w-1/4 rounded-full" style={{ background: p.accent }} />
        </div>
      </div>
    </div>
  );
}

interface Props {
  theme: ThemeDefinition;
  selected: boolean;
  /** Which palette to draw for themes with a light and a dark version. */
  scheme: ColorScheme;
  isDefault: boolean;
  onSelect: (theme: ThemeDefinition) => void;
}

export const ThemeCard = memo(function ThemeCard({ theme, selected, scheme, isDefault, onSelect }: Props) {
  const palette = getPalette(theme, scheme);
  const p = palette.preview;
  const swatches: Array<[string, string]> = [
    ['Background', p.background], ['Card', p.card], ['Elevated card', p.elevated], ['Primary accent', p.accent], ['Secondary accent', p.accent2],
  ];

  return (
    <label
      className={cn(
        'group relative block cursor-pointer rounded-[16px] border bg-surface p-2.5 transition-[transform,border-color,background-color] duration-200',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest',
        selected ? 'border-forest' : 'border-line hover:border-forest/50 motion-safe:hover:-translate-y-0.5',
      )}
      style={selected ? { boxShadow: 'var(--accent-glow)' } : undefined}
    >
      <input
        type="radio" name="theme" value={theme.id} checked={selected}
        onChange={() => onSelect(theme)} className="sr-only"
        aria-labelledby={`theme-name-${theme.id}`} aria-describedby={`theme-desc-${theme.id}`}
      />

      <div className="relative overflow-hidden rounded-xl border" style={{ aspectRatio: '16 / 10', borderColor: p.elevated }}>
        <div className="h-full w-full origin-center transition-transform duration-300 motion-safe:group-hover:scale-[1.03]">
          <MiniApp p={p} />
        </div>
        <AnimatePresence>
          {selected && (
            <motion.span
              key="check"
              initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 26 }}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-on-brand shadow-md"
              aria-hidden="true"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center gap-2 px-0.5">
        <span id={`theme-name-${theme.id}`} className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{theme.name}</span>
        {isDefault && <span className="shrink-0 rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-forest">Default</span>}
        {selected && <span className="sr-only">(current theme)</span>}
      </div>
      <p id={`theme-desc-${theme.id}`} className="mt-0.5 px-0.5 text-xs leading-snug text-muted">{theme.description}</p>

      <div className="mt-2.5 flex items-center gap-1.5 px-0.5" aria-hidden="true">
        {swatches.map(([label, color]) => (
          <span key={label} title={`${label} ${color}`} className="h-4 w-4 rounded-full ring-1 ring-inset ring-ink/20" style={{ background: color }} />
        ))}
      </div>
    </label>
  );
});
