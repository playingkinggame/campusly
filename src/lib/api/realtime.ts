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
