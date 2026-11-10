import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flag, Ghost, ShieldCheck, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AsyncView, EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { NoResults, ResultCount, SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { useAsync } from '@/hooks/useAsync';
import { toast } from '@/store/uiStore';
import { friendlyError } from '@/lib/errors';
import { deleteConfession, listAdminConfessions, listReports, resolveReport, reviewConfession } from '@/lib/api/admin';
import { searchText, tokenize } from '@/lib/search';
import { timeAgo } from '@/lib/utils';
import type { AdminConfession, AdminReport, ConfessionScope } from '@/types/db';
import { useLiveReload } from '@/hooks/useLiveReload';

type Tab = 'reports' | 'confessions';
type Status = 'open' | 'reviewing' | 'actioned' | 'dismissed' | 'all';

/** "11h 20m" / "35m" / "expired" */
function leftLabel(iso: string | null): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.max(m, 1)}m`;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('reports');
  const [statusFilter, setStatusFilter] = useState<Status>('open');
  const [scope, setScope] = useState<ConfessionScope>('pending');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminConfession | null>(null);

  const reports = useAsync(() => listReports(statusFilter), [statusFilter]);
  const confessions = useAsync(() => listAdminConfessions(scope), [scope]);
  const pendingCount = useAsync(() => listAdminConfessions('pending'), []);
  const openCount = useAsync(() => listReports('open'), []);
  useLiveReload(
    () => { void reports.reload(); void confessions.reload(); void pendingCount.reload(); void openCount.reload(); },
    { tables: ['reports'], pollMs: 20000 },
  );

  const tokens = tokenize(query);
  const reportRows = useMemo(
    () => searchText<AdminReport>(reports.data ?? [], query, (r) => [r.target_preview, r.target_type, r.reason, r.details, r.status]),
    [reports.data, query],
  );
  const confessionRows = useMemo(
    () => searchText<AdminConfession>(confessions.data ?? [], query, (c) => [c.body, c.author_name, c.author_username, c.author_reg_no]),
    [confessions.data, query],
  );

  const act = async (report: AdminReport, action: 'actioned' | 'dismissed' | 'reviewing') => {
    setBusy(report.id);
    try { await resolveReport(report.id, action); toast.success('Report updated.'); await Promise.all([reports.reload(), openCount.reload()]); }
    catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const review = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      await reviewConfession(id, approve);
      toast.success(approve ? 'Approved. It will disappear after 12 hours.' : 'Confession rejected.');
      await Promise.all([confessions.reload(), pendingCount.reload()]);
    } catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(deleting.id);
    try {
      await deleteConfession(deleting.id);
      toast.success('Confession deleted.');
      setDeleting(null);
      await Promise.all([confessions.reload(), pendingCount.reload(), openCount.reload()]);
    } catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const switchTab = (t: Tab) => { setTab(t); setQuery(''); };

  return (
    <div className="space-y-5">
      <header><h1 className="flex items-center gap-2 text-2xl font-bold text-forest sm:text-3xl"><ShieldCheck className="h-7 w-7" aria-hidden="true" /> Admin</h1><p className="text-sm text-muted">Moderation queue for reports and confessions.</p></header>
      <Tabs label="Admin sections" value={tab} onChange={(t) => switchTab(t as Tab)} tabs={[
        { id: 'reports', label: 'Reports', badge: (openCount.data ?? []).length },
        { id: 'confessions', label: 'Confessions', badge: (pendingCount.data ?? []).length },
      ]} />

      <SearchInput
        value={query}
        onChange={setQuery}
        label={tab === 'reports' ? 'Search reports' : 'Search confessions'}
        placeholder={tab === 'reports' ? 'Search reports by text, reason or type' : 'Search by confession text, author name or @username'}
      />
      <ResultCount n={tab === 'reports' ? reportRows.length : confessionRows.length} show={tokens.length > 0} />

      {tab === 'reports' ? (
        <>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Report status">
            {(['open', 'reviewing', 'actioned', 'dismissed', 'all'] as Status[]).map((s) => <Button key={s} size="sm" variant={statusFilter === s ? 'primary' : 'ghost'} onClick={() => setStatusFilter(s)}>{s}</Button>)}
          </div>
          <AsyncView loading={reports.loading} error={reports.error} onRetry={() => void reports.reload()} hasData={!!reports.data} isEmpty={!reports.loading && !reports.error && reportRows.length === 0}
            empty={tokens.length > 0 && (reports.data ?? []).length > 0
              ? <NoResults query={query} onClear={() => setQuery('')} />
              : <EmptyState icon={<Flag className="h-6 w-6" />} title="Queue is clear" text="No reports in this status." />}>
            <ul className="space-y-2">
              {reportRows.map((r) => (
                <li key={r.id}><Card className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-forest">{r.target_type} report · {r.reason}</p><p className="text-xs text-muted">{timeAgo(r.created_at)} · status {r.status}</p></div><div className="flex flex-wrap gap-1"><Button size="sm" variant="secondary" loading={busy === r.id} onClick={() => void act(r, 'reviewing')}>Reviewing</Button><Button size="sm" loading={busy === r.id} onClick={() => void act(r, 'actioned')}>Action</Button><Button size="sm" variant="ghost" loading={busy === r.id} onClick={() => void act(r, 'dismissed')}>Dismiss</Button></div></div>
                  {r.details && <p className="text-sm text-muted">{r.details}</p>}
                  {r.target_preview && <p className="rounded-xl bg-mint/30 p-2 text-xs text-forest">“{r.target_preview}”</p>}
                </Card></li>
              ))}
            </ul>
          </AsyncView>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Confession status">
            {([['pending', 'Pending review'], ['live', 'Live (12h)'], ['expired', 'Expired'], ['all', 'All']] as Array<[ConfessionScope, string]>).map(([s, label]) => (
              <Button key={s} size="sm" variant={scope === s ? 'primary' : 'ghost'} onClick={() => setScope(s)}>{label}</Button>
            ))}
          </div>
          <Card className="!bg-mint/40 !p-3 text-xs text-muted">Only admins can see who wrote a confession. Approved confessions disappear from the feed 12 hours after approval; you can delete any of them at any time.</Card>
          <AsyncView loading={confessions.loading} error={confessions.error} onRetry={() => void confessions.reload()} hasData={!!confessions.data} isEmpty={!confessions.loading && !confessions.error && confessionRows.length === 0}
            empty={tokens.length > 0 && (confessions.data ?? []).length > 0
              ? <NoResults query={query} onClear={() => setQuery('')} />
              : <EmptyState icon={<Ghost className="h-6 w-6" />} title={scope === 'pending' ? 'No pending confessions' : 'Nothing here'} text={scope === 'pending' ? 'New anonymous posts will wait here for review.' : 'No confessions in this list.'} />}>
            <ul className="space-y-2">
              {confessionRows.map((c) => (
                <li key={c.id}><Card className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm text-ink/90">{c.body}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1 font-semibold text-forest">
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      {c.author_username
                        ? <Link to={`/u/${c.author_username}`} className="hover:underline">{c.author_name ?? 'Unnamed'} (@{c.author_username})</Link>
                        : <span>Author unknown</span>}
                      {c.author_reg_no && <span className="font-normal text-muted">· {c.author_reg_no}</span>}
                    </span>
                    <span>{timeAgo(c.created_at)}</span>
                    <span className="rounded-full bg-mint px-2 py-0.5 font-semibold text-forest">{c.status}</span>
                    {c.status === 'approved' && c.expires_at && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {leftLabel(c.expires_at) === 'expired' ? 'Expired from feed' : `Disappears in ${leftLabel(c.expires_at)}`}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.status === 'pending' && (
                      <>
                        <Button size="sm" loading={busy === c.id} onClick={() => void review(c.id, true)}>Approve</Button>
                        <Button size="sm" variant="ghost" loading={busy === c.id} onClick={() => void review(c.id, false)}>Reject</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete</Button>
                  </div>
                </Card></li>
              ))}
            </ul>
          </AsyncView>
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this confession?"
        text="It is removed for everyone and cannot be recovered. Reports about it are closed."
        confirmLabel="Delete"
        danger
        loading={!!deleting && busy === deleting.id}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
