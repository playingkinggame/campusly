import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePresence } from '@/store/presenceStore';

/** One presence channel for the shell. hide_online users never track themselves. */
export function usePresenceSync(userId: string, hideOnline: boolean) {
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const channel = supabase.channel('presence:campusly', { config: { presence: { key: userId } } });

    channel.on('presence', { event: 'sync' }, () => {
      if (alive) usePresence.getState().setOnline(Object.keys(channel.presenceState()));
    });

    channel.subscribe((status) => {
      if (!alive) return;
      if (status === 'SUBSCRIBED' && !hideOnline) void channel.track({ online_at: new Date().toISOString() });
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') usePresence.getState().reset();
    });

    return () => {
      alive = false;
      if (!hideOnline) void channel.untrack();
      void supabase.removeChannel(channel);
      usePresence.getState().reset();
    };
  }, [userId, hideOnline]);
}
