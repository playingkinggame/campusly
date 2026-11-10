import { useEffect } from 'react';
import { PRESENCE_INTERVAL_MS } from '@/lib/constants';
import { touchPresence } from '@/lib/api/profiles';
import { listMine, markAllDelivered, totalUnread } from '@/lib/api/conversations';
import { countIncoming } from '@/lib/api/connections';
import { countUnreadNotifications, listNotifications } from '@/lib/api/notifications';
import { subscribeMyProfile, subscribeShell } from '@/lib/api/realtime';
import { NOTIFICATION_META } from '@/lib/notificationMeta';
import { useUnread } from '@/store/unreadStore';
import { useAuth } from '@/store/authStore';
import { toast } from '@/store/uiStore';

/**
 * Runs once for the whole app shell:
 *  - touch_presence() on load and every ~60s while the tab is visible
 *  - marks incoming messages as "delivered"
 *  - keeps the unread badges fresh through Realtime (plus a refresh on reconnect / tab focus)
 */
export function useShellSync(userId: string) {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refreshCounts = async () => {
      try {
        const [convs, req, notif] = await Promise.all([listMine(), countIncoming(), countUnreadNotifications()]);
        if (stopped) return;
        useUnread.getState().set({ chat: totalUnread(convs), requests: req, notifications: notif });
      } catch { /* badges are a nicety; ignore errors */ }
    };
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refreshCounts(), 400);
    };

    // touch_presence() updates "last seen" and the day streak on the server.
    // Reload the profile right after, so the new streak shows without a page refresh.
    const touch = () => { void touchPresence().then(() => useAuth.getState().refreshProfile()); };

    // "Aarav gave you a heart": a small pop-up for every new notification.
    const announceLatest = async () => {
      try {
        const [latest] = await listNotifications(1);
        if (!latest || latest.read_at) return;
        if (Date.now() - new Date(latest.created_at).getTime() > 60_000) return;
        const text = NOTIFICATION_META[latest.kind]?.text;
        if (text) toast.info(`${latest.actor?.full_name ?? 'Someone'} ${text}`);
      } catch { /* a missed pop-up is fine */ }
    };

    touch();
    void markAllDelivered().then(refreshCounts);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') touch();
    }, PRESENCE_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') { touch(); refreshSoon(); }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refreshSoon);

    const unsubscribe = subscribeShell(userId, (e) => {
      if (e === 'messages') void markAllDelivered();
      if (e === 'notifications') {
        void announceLatest();
        void useAuth.getState().refreshProfile(); // a heart changes your "Hearts received" number
      }
      refreshSoon();
    });

    // Your own profile row (streak, hearts...) pushed to the screen the moment it changes.
    const unsubscribeProfile = subscribeMyProfile(userId, (row) => useAuth.getState().patchProfile(row));

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refreshSoon);
      unsubscribe();
      unsubscribeProfile();
    };
  }, [userId]);
}
