import { useEffect, useRef } from 'react';
import { subscribeTables, type LiveTable } from '@/lib/api/realtime';

interface Options {
  /** Tables to watch with Realtime. A change in any of them reloads the screen quietly. */
  tables?: LiveTable[];
  /** Also reload every N milliseconds while the tab is visible (for views Realtime cannot watch). */
  pollMs?: number;
  enabled?: boolean;
}

/**
 * Keeps a screen up to date by itself.
 *  - reloads (quietly, no spinner) when a watched table changes
 *  - reloads when you come back to the tab or the internet returns
 *  - optionally polls every few seconds
 * Pass the `reload` function you already have (for example from useAsync).
 */
export function useLiveReload(reload: () => unknown, options: Options = {}) {
  const { tables, pollMs, enabled = true } = options;
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const tablesKey = JSON.stringify(tables ?? []);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Several changes in a row (for example 10 people tapping "Going") become one reload.
    const reloadSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!stopped) void reloadRef.current(); }, 350);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') reloadSoon(); };

    const list = (JSON.parse(tablesKey) as LiveTable[]);
    const unsubscribe = list.length ? subscribeTables('screen', list, reloadSoon) : () => {};
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', reloadSoon);
    const poll = pollMs
      ? setInterval(() => { if (document.visibilityState === 'visible') void reloadRef.current(); }, pollMs)
      : null;

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', reloadSoon);
      unsubscribe();
    };
  }, [tablesKey, pollMs, enabled]);
}
