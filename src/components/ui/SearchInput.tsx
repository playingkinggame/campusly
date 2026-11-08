import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
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
        onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange(''); } }}
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
