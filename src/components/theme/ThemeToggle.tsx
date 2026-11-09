import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/store/themeStore';
import { getTheme } from '@/themes/theme-config';
import { cn } from '@/lib/utils';

/**
 * Small sun/moon button for Campusly Original (the only theme with a light and a dark version).
 * The other five themes are dark-only, so the button hides itself; pick them in Settings.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const themeId = useTheme((s) => s.themeId);
  const scheme = useTheme((s) => s.scheme);
  const toggle = useTheme((s) => s.toggle);
  if (!getTheme(themeId).adaptive) return null;
  const isDark = scheme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-forest transition-colors hover:bg-mint/70', className)}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
