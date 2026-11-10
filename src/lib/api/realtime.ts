import { supabase } from '../supabase';

export type ShellEvent = 'messages' | 'members' | 'connections' | 'notifications' | 'reconnect';

/**
 * One channel for the whole app shell. Any change that could alter a badge
 * (new message, read marker, connection request, notification) calls onChange.
 * Row Level Security decides which events each person actually receives.
 */
/** Chat-list refreshes: any message or membership change the user can see. */
export function subscribeChatList(userId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`chat-list:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export function subscribeShell(userId: string, onChange: (e: ShellEvent) => void): () => void {
  let wasDown = false;
  const channel = supabase
    .channel(`shell:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => onChange('messages'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${userId}` }, () => onChange('members'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => onChange('connections'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => onChange('notifications'))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (wasDown) onChange('reconnect');
        wasDown = false;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        wasDown = true;
      }
    });
  return () => { void supabase.removeChannel(channel); };
}

/**
 * Who is online right now. One shared channel; people with "hide online" never announce themselves.
 * onOnline gets the list of online user ids; onDown fires when the connection drops.
 */
export function joinPresence(
  userId: string,
  hideOnline: boolean,
  onOnline: (ids: string[]) => void,
  onDown: () => void,
): () => void {
  let alive = true;
  const channel = supabase.channel('presence:campusly', { config: { presence: { key: userId } } });
  channel.on('presence', { event: 'sync' }, () => {
    if (alive) onOnline(Object.keys(channel.presenceState()));
  });
  channel.subscribe((status) => {
    if (!alive) return;
    if (status === 'SUBSCRIBED' && !hideOnline) void channel.track({ online_at: new Date().toISOString() });
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onDown();
  });
  return () => {
    alive = false;
    if (!hideOnline) void channel.untrack();
    void supabase.removeChannel(channel);
    onDown();
  };
}

export interface ChatChannel {
  /** Tell the other person you are typing. */
  sendTyping: (payload: { userId: string; name: string; at: number }) => void;
  close: () => void;
}

/** Live updates and the typing indicator for one conversation. */
export function openChatChannel(
  conversationId: string,
  handlers: {
    onChange: () => void;
    onTyping: (payload: { userId?: string; name?: string }) => void;
    onStatus: (connected: boolean) => void;
  },
): ChatChannel {
  let alive = true;
  const channel = supabase
    .channel(`chat:${conversationId}`, { config: { broadcast: { self: false } } })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, () => handlers.onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => handlers.onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_receipts' }, () => handlers.onChange())
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (alive) handlers.onTyping(payload as { userId?: string; name?: string });
    })
    .subscribe((status) => {
      if (!alive) return;
      handlers.onStatus(status === 'SUBSCRIBED');
    });
  return {
    sendTyping: (payload) => { void channel.send({ type: 'broadcast', event: 'typing', payload }); },
    close: () => { alive = false; void supabase.removeChannel(channel); },
  };
}

/** One table to watch. `filter` is optional, for example `user_id=eq.<id>`. */
export type LiveTable = string | { table: string; filter?: string };

/**
 * Calls onChange whenever a row in any of these tables changes (insert, update or delete).
 * Row Level Security decides which changes this person is allowed to receive.
 * onChange also fires after the connection comes back, so nothing is missed while offline.
 */
export function subscribeTables(name: string, tables: LiveTable[], onChange: () => void): () => void {
  let wasDown = false;
  let channel = supabase.channel(`live:${name}:${Math.random().toString(36).slice(2, 10)}`);
  for (const t of tables) {
    const spec = typeof t === 'string' ? { table: t } : t;
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: spec.table, ...(spec.filter ? { filter: spec.filter } : {}) },
      () => onChange(),
    );
  }
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      if (wasDown) onChange();
      wasDown = false;
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      wasDown = true;
    }
  });
  const handle = channel;
  return () => { void supabase.removeChannel(handle); };
}

/** Streak, hearts and every other change to your OWN profile row, the moment it happens. */
export function subscribeMyProfile(userId: string, onRow: (row: Record<string, unknown>) => void): () => void {
  const channel = supabase
    .channel(`my-profile:${userId}:${Math.random().toString(36).slice(2, 10)}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      (payload) => { if (payload.new && typeof payload.new === 'object') onRow(payload.new as Record<string, unknown>); },
    )
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
