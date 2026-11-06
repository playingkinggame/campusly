import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError } from '@/lib/errors';
import { markAllDelivered, markSeen } from '@/lib/api/conversations';
import {
  editMessage, listMessages, sendMessage, sortByCreated, toggleReaction, unsendMessage,
  uploadChatFile, uploadVoiceNote, type ChatMessage,
} from '@/lib/api/chat';

function merge(previous: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map(previous.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort(sortByCreated);
}

function temp(conversationId: string, meId: string, text: string, replyTo: string | null): ChatMessage {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversation_id: conversationId, sender_id: meId, kind: 'text', body: text,
    media_path: null, media_name: null, media_mime: null, media_size: null, duration_ms: null,
    waveform: null, reply_to: replyTo, edited_at: null, deleted_at: null,
    created_at: new Date().toISOString(), sender: null, reply: null, reactions: [], receipts: [],
  };
}

export function useChatRoom(conversationId: string, meId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typing, setTyping] = useState<Record<string, { name: string; at: number }>>({});
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingSentRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const refreshLatest = useCallback(async () => {
    try {
      const page = await listMessages(conversationId, null, 40);
      setMessages((prev) => (prev.length ? merge(prev, page.messages) : page.messages));
    } catch { /* realtime refresh is best effort */ }
  }, [conversationId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listMessages(conversationId, null, 40);
      setMessages(page.messages);
      setHasMore(page.hasMore);
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    let alive = true;
    const channel = supabase
      .channel(`chat:${conversationId}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, () => { void refreshLatest(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => { void refreshLatest(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_receipts' }, () => { void refreshLatest(); })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as { userId?: string; name?: string };
        if (!alive || !p.userId || p.userId === meId) return;
        setTyping((prev) => ({ ...prev, [p.userId!]: { name: p.name ?? 'Someone', at: Date.now() } }));
      })
      .subscribe((status) => {
        if (!alive) return;
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') void refreshLatest();
      });
    channelRef.current = channel;

    const cleanup = setInterval(() => {
      setTyping((prev) => {
        const next: typeof prev = {};
        for (const [id, value] of Object.entries(prev)) if (Date.now() - value.at < 3500) next[id] = value;
        return next;
      });
    }, 1500);

    return () => {
      alive = false;
      clearInterval(cleanup);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [conversationId, meId, refreshLatest]);

  useEffect(() => {
    if (loading) return;
    void markSeen(conversationId);
    void markAllDelivered();
  }, [conversationId, loading, messages.length]);

  const loadOlder = async () => {
    const oldest = messagesRef.current[0]?.created_at;
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await listMessages(conversationId, oldest, 40);
      setMessages((prev) => merge(page.messages, prev));
      setHasMore(page.hasMore);
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoadingOlder(false); }
  };

  const sendText = async (text: string, replyTo: string | null): Promise<boolean> => {
    const body = text.trim();
    if (!body) return false;
    const optimistic = temp(conversationId, meId, body, replyTo);
    setMessages((prev) => merge(prev, [optimistic]));
    try {
      const real = await sendMessage(conversationId, { kind: 'text', body, reply_to: replyTo });
      setMessages((prev) => prev.map((m) => m.id === optimistic.id
        ? { ...real, sender: null, reply: optimistic.reply, reactions: [], receipts: [] } : m));
      return true;
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      throw new Error(friendlyError(e));
    }
  };

  const sendFile = async (file: File) => {
    const uploaded = await uploadChatFile(conversationId, file);
    const real = await sendMessage(conversationId, {
      kind: uploaded.kind, media_path: uploaded.path, media_name: uploaded.name,
      media_mime: uploaded.mime, media_size: uploaded.size,
    });
    setMessages((prev) => merge(prev, [{ ...real, sender: null, reply: null, reactions: [], receipts: [] }]));
  };

  const sendVoice = async (blob: Blob, durationMs: number, waveform: number[] | null) => {
    const uploaded = await uploadVoiceNote(conversationId, blob, durationMs, waveform);
    const real = await sendMessage(conversationId, {
      kind: 'voice', media_path: uploaded.path, media_name: 'Voice note', media_mime: uploaded.mime,
      media_size: uploaded.size, duration_ms: Math.min(600000, Math.max(0, Math.round(durationMs))), waveform,
    });
    setMessages((prev) => merge(prev, [{ ...real, sender: null, reply: null, reactions: [], receipts: [] }]));
  };

  const react = async (message: ChatMessage, emoji: string) => {
    const mine = message.reactions.find((r) => r.user_id === meId && r.emoji === emoji);
    await toggleReaction(message.id, emoji, !mine);
    setMessages((prev) => prev.map((m) => {
      if (m.id !== message.id) return m;
      if (mine) return { ...m, reactions: m.reactions.filter((r) => !(r.user_id === meId && r.emoji === emoji)) };
      return { ...m, reactions: [...m.reactions, { message_id: m.id, user_id: meId, emoji, created_at: new Date().toISOString() }] };
    }));
  };

  const edit = async (id: string, body: string) => {
    const updated = await editMessage(id, body);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, body: updated.body, edited_at: updated.edited_at } : m));
  };

  const unsend = async (id: string) => {
    await unsendMessage(id);
    setMessages((prev) => prev.map((m) => m.id === id ? {
      ...m, body: null, media_path: null, media_name: null, media_mime: null, media_size: null,
      duration_ms: null, waveform: null, deleted_at: new Date().toISOString(),
    } : m));
  };

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - typingSentRef.current < 1200) return;
    typingSentRef.current = now;
    const channel = channelRef.current;
    if (channel) void channel.send({ type: 'broadcast', event: 'typing', payload: { userId: meId, name: 'Someone', at: now } });
  }, [meId]);

  return {
    messages, loading, error, hasMore, loadingOlder, connected,
    typing: Object.values(typing).map((t) => t.name),
    loadOlder, reload: load, refreshLatest, sendText, sendFile, sendVoice, react, edit, unsend, notifyTyping,
  };
}
