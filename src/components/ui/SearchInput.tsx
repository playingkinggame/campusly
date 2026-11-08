import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Search, SearchX, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightParts } from '@/lib/search';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  label: string; // read by screen readers
}

/** Rounded search box with a magnifier and a clear (x) button. Esc clears it. */
export const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { value, onChange, label, className, placeholder = 'Search', ...rest }, ref,
) {
  const id = useId();
  return (
    <div className={cn('relative', className)} role="search">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        type="search"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); if (e.key === 'Escape' && value) { e.preventDefault(); onChange(''); } }}
        className="h-12 w-full rounded-2xl border border-line bg-surface/80 pl-12 pr-11 text-[15px] text-ink placeholder:text-muted/70 focus:border-forest [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-forest"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

/** Shows `text` with the letters that match the search words in bold. */
export function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  return (
    <>
      {highlightParts(text, tokens).map((p, i) =>
        p.hit ? <mark key={i} className="rounded-sm bg-brand/20 px-0.5 font-bold text-inherit">{p.text}</mark> : <span key={i}>{p.text}</span>,
      )}
    </>
  );
}

/** Shown instead of an empty list when a search finds nothing. */
export function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-forest" aria-hidden="true">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-forest">No results</h3>
      <p className="max-w-sm text-sm text-muted">Nothing matches “{query.trim()}”. Check the spelling or try fewer letters.</p>
      <button type="button" onClick={onClear} className="mt-1 rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-forest hover:bg-mint/70">Clear search</button>
    </div>
  );
}

/** Small "3 found" line under a search box. */
export function ResultCount({ n, show }: { n: number; show: boolean }) {
  if (!show) return null;
  return <p className="-mt-2 text-xs text-muted" role="status" aria-live="polite">{n} {n === 1 ? 'result' : 'results'}</p>;
}
