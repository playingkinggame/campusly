import { useCallback } from 'react';
import { motion } from 'motion/react';
import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/store/themeStore';
import { DEFAULT_THEME_ID, THEMES } from '@/themes/theme-config';
import { cn } from '@/lib/utils';
import type { ThemeDefinition, ThemeMode } from '@/themes/types';
import { ThemeCard } from './ThemeCard';

const MODES: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
];

/** Appearance & Themes: pick one of six themes. The choice applies instantly and is saved to the account. */
export function AppearancePanel() {
  const themeId = useTheme((s) => s.themeId);
  const scheme = useTheme((s) => s.scheme);
  const mode = useTheme((s) => s.mode);
  const selectTheme = useTheme((s) => s.selectTheme);
  const resetToDefault = useTheme((s) => s.resetToDefault);
  const setMode = useTheme((s) => s.setMode);

  const onSelect = useCallback((t: ThemeDefinition) => selectTheme(t.id), [selectTheme]);
  const current = THEMES.find((t) => t.id === themeId);

  return (
    <section aria-labelledby="appearance-heading" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="appearance-heading" className="text-lg font-bold text-forest sm:text-xl">Appearance &amp; Themes</h2>
          <p className="text-sm text-muted">Personalize your Campusly experience.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={resetToDefault} disabled={themeId === DEFAULT_THEME_ID}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset to default
        </Button>
      </div>

      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            selected={t.id === themeId}
            // Campusly Original draws its light or dark version; the others have one look.
            scheme={t.id === themeId ? scheme : 'light'}
            isDefault={t.id === DEFAULT_THEME_ID}
            onSelect={onSelect}
          />
        ))}
      </div>

      {current?.adaptive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="space-y-2 rounded-2xl border border-line bg-surface p-3"
        >
          <div>
            <p className="text-sm font-semibold text-forest">Campusly Original mode</p>
            <p className="text-xs text-muted">Auto follows your phone or computer setting. Saved on this device.</p>
          </div>
          <div role="radiogroup" aria-label="Light or dark mode" className="grid grid-cols-3 gap-2 rounded-2xl bg-mint/60 p-1">
            {MODES.map(({ value, label, icon: Icon }) => {
              const active = mode === value;
              return (
                <button
                  key={value} type="button" role="radio" aria-checked={active} onClick={() => setMode(value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    active ? 'bg-surface text-forest shadow-sm' : 'text-forest/70 hover:text-forest',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
}
