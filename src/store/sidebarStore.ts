import { create } from 'zustand';

const KEY = 'campusly-sidebar';

/** The sidebar is open the first time. After you choose, this device remembers it. */
function readCollapsed(): boolean {
  try { return localStorage.getItem(KEY) === 'collapsed'; } catch { return false; }
}

interface SidebarState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

export const useSidebar = create<SidebarState>((set, get) => ({
  collapsed: readCollapsed(),
  setCollapsed: (collapsed) => {
    try { localStorage.setItem(KEY, collapsed ? 'collapsed' : 'open'); } catch { /* storage blocked: still works for this visit */ }
    set({ collapsed });
  },
  toggle: () => get().setCollapsed(!get().collapsed),
}));
