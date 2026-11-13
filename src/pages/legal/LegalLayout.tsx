import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { LEGAL_LAST_UPDATED, LEGAL_VERSION } from '@/lib/legal';

interface Props {
  title: string;
  intro: string;
  children: ReactNode;
}

export function LegalLayout({ title, intro, children }: Props) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-line bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" aria-label="Campusly home" className="rounded-xl">
            <Brand />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-forest hover:bg-mint/70"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Legal</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-forest sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          Last updated {LEGAL_LAST_UPDATED} · Version {LEGAL_VERSION}
        </p>
        <p className="mt-5 rounded-2xl border border-line bg-surface/70 px-4 py-3 text-sm leading-relaxed text-muted">
          {intro}
        </p>

        <div className="mt-10 space-y-9">{children}</div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Campusly · Made at VIT Chennai</p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link to="/privacy" className="font-semibold text-forest hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="font-semibold text-forest hover:underline">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** One numbered/titled block inside a legal page. */
export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-3">
      <h2 id={`${id}-title`} className="text-lg font-bold text-forest">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

/** A simple bullet list with the app's spacing. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-forest/60">{children}</ul>;
}
