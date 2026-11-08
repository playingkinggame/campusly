import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchX, UserMinus, UserPlus, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AsyncView, EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Highlight, SearchInput } from '@/components/ui/SearchInput';
import { MessageButton } from '@/components/social/MessageButton';
import { useAsync } from '@/hooks/useAsync';
import { toast } from '@/store/uiStore';
import { friendlyError } from '@/lib/errors';
import { listAccepted, listIncoming, listOutgoing, removeConnection, respond, type ConnectionWithPerson } from '@/lib/api/connections';
import { searchPeople, tokenize } from '@/lib/search';
import { timeAgo } from '@/lib/utils';
import type { MiniProfile } from '@/types/db';

type TabId = 'incoming' | 'outgoing' | 'accepted';

export default function RequestsPage() {
  const [tab, setTab] = useState<TabId>('incoming');
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ConnectionWithPerson | null>(null);
  const [query, setQuery] = useState('');

  const state = useAsync(async () => {
    const [incoming, outgoing, accepted] = await Promise.all([listIncoming(), listOutgoing(), listAccepted()]);
    return { incoming, outgoing, accepted };
  }, []);

  const lists = state.data ?? { incoming: [], outgoing: [], accepted: [] };
  const allRows = (lists[tab] as ConnectionWithPerson[]).filter(
    (row): row is ConnectionWithPerson & { person: MiniProfile } => row.person !== null,
  );
  // WhatsApp-style search: type "sr" and every name or username with "sr" shows up, best matches first
  const tokens = tokenize(query);
  const searching = tokens.length > 0;
  const rows = searchPeople(allRows, query, (r) => r.person);

  const accept = async (row: ConnectionWithPerson) => {
    setBusy(`accept:${row.id}`);
    try { await respond(row.id, 'accepted'); toast.success('Request accepted.'); await state.reload(); }
    catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const decline = async (row: ConnectionWithPerson) => {
    setBusy(`decline:${row.id}`);
    try { await respond(row.id, 'declined'); toast.info('Request declined.'); await state.reload(); }
    catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const cancel = async (row: ConnectionWithPerson) => {
    setBusy(`cancel:${row.id}`);
    try { await removeConnection(row.id); toast.success('Request cancelled.'); await state.reload(); }
    catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const remove = async () => {
    if (!removing) return;
    setBusy(`remove:${removing.id}`);
    try {
      await removeConnection(removing.id);
      toast.success('Connection removed.');
      setRemoving(null);
      await state.reload();
    } catch (e) { toast.error(friendlyError(e)); }
    finally { setBusy(null); }
  };

  const emptyForTab = () => {
    if (tab === 'incoming') {
      return <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No requests waiting" text="When someone asks to connect, it will show up here." action={<Link to="/discover"><Button size="sm">Find people</Button></Link>} />;
    }
    if (tab === 'outgoing') {
      return <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No sent requests" text="Find someone on Discover and send a connection request." action={<Link to="/discover"><Button size="sm">Find people</Button></Link>} />;
    }
    return <EmptyState icon={<Users className="h-6 w-6" />} title="No connections yet" text="Accepted requests appear here with a Message button." action={<Link to="/discover"><Button size="sm">Find people</Button></Link>} />;
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">Requests</h1>
        <p className="text-sm text-muted">Accept people you know, cancel old requests, and message your connections.</p>
      </header>

      <Tabs
        label="Connection requests"
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: 'incoming', label: 'Incoming', badge: lists.incoming.length },
          { id: 'outgoing', label: 'Outgoing', badge: lists.outgoing.length },
          { id: 'accepted', label: 'Connected', badge: lists.accepted.length },
        ]}
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        label="Search people in this list"
        placeholder={tab === 'accepted' ? 'Search your connections by name or @username' : 'Search by name or @username'}
      />
      {searching && !state.loading && rows.length > 0 && (
        <p className="-mt-2 text-xs text-muted" role="status" aria-live="polite">
          {rows.length} {rows.length === 1 ? 'person' : 'people'} found
        </p>
      )}

      <AsyncView
        loading={state.loading}
        error={state.error}
        onRetry={() => void state.reload()}
        hasData={!!state.data}
        isEmpty={!state.loading && !state.error && rows.length === 0}
        empty={searching && allRows.length > 0
          ? <EmptyState icon={<SearchX className="h-6 w-6" />} title="No one found" text={`Nobody in this list matches "${query.trim()}". Check the spelling or try fewer letters.`} action={<Button size="sm" variant="secondary" onClick={() => setQuery('')}>Clear search</Button>} />
          : emptyForTab()}
      >
        <Card className="!p-2">
          <ul className="divide-y divide-line/70">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 p-3">
                <Link to={`/u/${row.person.username}`} aria-label={`Open ${row.person.full_name}'s profile`}>
                  <Avatar path={row.person.avatar_path} name={row.person.full_name} size={44} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${row.person.username}`} className="block truncate text-sm font-semibold text-forest hover:underline"><Highlight text={row.person.full_name ?? ''} tokens={tokens} /></Link>
                  <p className="truncate text-xs text-muted">@<Highlight text={row.person.username ?? ''} tokens={tokens} /></p>
                  <p className="text-xs text-muted">
                    {tab === 'accepted' ? 'Connected' : `${tab === 'incoming' ? 'Asked' : 'Sent'} ${timeAgo(row.created_at)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tab === 'incoming' && (
                    <>
                      <Button size="sm" loading={busy === `accept:${row.id}`} onClick={() => void accept(row)}>Accept</Button>
                      <Button variant="ghost" size="sm" loading={busy === `decline:${row.id}`} onClick={() => void decline(row)}>Decline</Button>
                    </>
                  )}
                  {tab === 'outgoing' && (
                    <Button variant="ghost" size="sm" loading={busy === `cancel:${row.id}`} onClick={() => void cancel(row)}>Cancel</Button>
                  )}
                  {tab === 'accepted' && (
                    <>
                      <MessageButton userId={row.person.id} size="sm" variant="secondary" />
                      <Button variant="ghost" size="sm" onClick={() => setRemoving(row)}>
                        <UserMinus className="h-4 w-4" aria-hidden="true" /> Remove
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </AsyncView>

      <ConfirmDialog
        open={!!removing}
        title="Remove connection?"
        text="You will no longer be connected, and you will not be able to send new messages to each other."
        confirmLabel="Remove"
        danger
        loading={!!removing && busy === `remove:${removing.id}`}
        onConfirm={() => void remove()}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
