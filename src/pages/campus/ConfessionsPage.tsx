import { useEffect, useState, type FormEvent } from 'react';
import { Clock, Ghost, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Field';
import { AsyncView, EmptyState } from '@/components/ui/Feedback';
import { NoResults, ResultCount, SearchInput } from '@/components/ui/SearchInput';
import { PostActions } from '@/components/campus/PostActions';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/store/authStore';
import { toast } from '@/store/uiStore';
import { friendlyError } from '@/lib/errors';
import { createConfession, listConfessions } from '@/lib/api/campus';
import { deleteConfession } from '@/lib/api/admin';
import { searchText, tokenize } from '@/lib/search';
import { timeAgo } from '@/lib/utils';
import { useLiveReload } from '@/hooks/useLiveReload';

/** "Disappears in 11h" / "in 25m" */
function leftLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Disappearing now';
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `Disappears in ${Math.floor(m / 60)}h ${m % 60}m` : `Disappears in ${Math.max(m, 1)}m`;
}

export default function ConfessionsPage() {
  const isAdmin = useAuth((s) => s.isAdmin);
  const state = useAsync(listConfessions, []);
  // the confessions feed is a filtered view, so Realtime cannot watch it: check every 30 seconds
  useLiveReload(state.reload, { pollMs: 30000 });
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [, tick] = useState(0);

  // refresh the "disappears in" labels, and drop expired posts, every minute
  useEffect(() => {
    const t = setInterval(() => { tick((n) => n + 1); void state.reload(); }, 60_000);
    return () => clearInterval(t);
  }, [state.reload]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await createConfession(body); toast.success('Confession submitted for review.'); setOpen(false); setBody(''); await state.reload(); }
    catch (err) { toast.error(friendlyError(err)); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await deleteConfession(id); toast.success('Confession deleted.'); await state.reload(); }
    catch (err) { toast.error(friendlyError(err)); }
  };

  const all = state.data ?? [];
  const tokens = tokenize(query);
  const rows = searchText(all, query, (c) => [c.body]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold text-forest sm:text-3xl"><Ghost className="h-7 w-7" aria-hidden="true" /> Confessions</h1><p className="text-sm text-muted">Anonymous, kind and moderated. Be nice.</p></div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" /> Confess</Button>
      </header>
      <Card className="!bg-mint/40 !p-3 text-xs text-muted">Everything is reviewed before it appears, and each confession disappears 12 hours after it is approved. Other students never see your name. No names, no harassment, no private details.</Card>

      <SearchInput value={query} onChange={setQuery} label="Search confessions" placeholder="Search confessions" />
      <ResultCount n={rows.length} show={tokens.length > 0} />

      <AsyncView loading={state.loading} error={state.error} onRetry={() => void state.reload()} hasData={!!state.data} isEmpty={!state.loading && !state.error && rows.length === 0}
        empty={tokens.length > 0 && all.length > 0
          ? <NoResults query={query} onClear={() => setQuery('')} />
          : <EmptyState icon={<Ghost className="h-6 w-6" />} title="No confessions right now" text="Confessions stay for 12 hours. Share something anonymous and wholesome." action={<Button size="sm" onClick={() => setOpen(true)}>Write a confession</Button>} />}>
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}><Card className="!bg-surface/70">
              <div className="flex items-start justify-between gap-2"><p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">{c.body}</p><PostActions targetType="confession" targetId={c.id} targetName="Confession" onDelete={isAdmin ? () => remove(c.id) : undefined} onChanged={() => void state.reload()} /></div>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>Anonymous · {timeAgo(c.created_at)}</span>
                {leftLabel(c.expires_at) && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {leftLabel(c.expires_at)}</span>}
              </p>
            </Card></li>
          ))}
        </ul>
      </AsyncView>
      <Modal open={open} title="Write a confession" onClose={() => setOpen(false)} footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="confession-form" loading={saving}>Submit</Button></>}>
        <form id="confession-form" onSubmit={submit} className="space-y-3">
          <Textarea label="Your confession" value={body} onChange={(e) => setBody(e.target.value)} required maxLength={1000} hint={`${body.length}/1000 · other students will not see your name`} />
          <p className="text-xs text-muted">Posts go to a moderator first, and moderators can see who wrote them. Once approved, a confession disappears after 12 hours. Do not include names or personal information.</p>
        </form>
      </Modal>
    </div>
  );
}
