import { NavLink } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { useUnread } from '@/store/unreadStore';
import { useSidebar } from '@/store/sidebarStore';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ADMIN_ITEM, CAMPUS_ITEMS, PROFILE_ITEM, SIDEBAR_MAIN, type NavItem } from './navItems';
import { Brand } from './Brand';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** One menu row. When the sidebar is collapsed only the icon shows (label stays for screen readers + tooltip). */
function Item({ item, badge, collapsed }: { item: NavItem; badge: number; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to} end={item.to === '/'}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => cn(
        'relative flex items-center rounded-2xl py-2.5 text-sm font-semibold transition-colors',
        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
        isActive ? 'bg-brand text-on-brand' : 'text-forest/80 hover:bg-mint/70',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {collapsed ? (
        badge > 0 && <span className="absolute right-1 top-0.5 scale-90"><CountBadge n={badge} /></span>
      ) : (
        <>
          <span className="flex-1 whitespace-nowrap">{item.label}</span>
          <CountBadge n={badge} />
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const profile = useAuth((s) => s.profile);
  const isAdmin = useAuth((s) => s.isAdmin);
  const signOut = useAuth((s) => s.signOut);
  const unread = useUnread();
  const collapsed = useSidebar((s) => s.collapsed);
  const toggle = useSidebar((s) => s.toggle);
  const badgeOf = (i: NavItem) => (i.badge === 'chat' ? unread.chat : i.badge === 'requests' ? unread.requests : 0);

  const rowClass = (isActive = false) => cn(
    'flex items-center rounded-2xl py-2.5 text-sm font-semibold transition-colors',
    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
    isActive ? 'bg-brand text-on-brand' : 'text-muted hover:bg-mint/70',
  );

  return (
    <aside
      id="app-sidebar"
      aria-label="Sidebar"
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col gap-4 overflow-hidden border-r border-line bg-sidebar p-4 transition-[width] duration-200 ease-out md:flex',
        collapsed ? 'w-[76px] px-3' : 'w-64',
      )}
    >
      <div className={cn('flex pt-1', collapsed ? 'flex-col items-center gap-3' : 'items-center justify-between px-2')}>
        {collapsed
          ? <img src="/icons/icon.svg" alt="Campusly" className="h-8 w-8" />
          : <Brand />}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-forest/80 transition-colors hover:bg-mint/70"
        >
          {collapsed
            ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {SIDEBAR_MAIN.map((i) => <Item key={i.to} item={i} badge={badgeOf(i)} collapsed={collapsed} />)}
      </nav>

      <nav aria-label="Campus" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {collapsed
          ? <div className="mx-3 my-1.5 border-t border-line" role="separator" />
          : <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Campus</p>}
        {CAMPUS_ITEMS.map((i) => <Item key={i.to} item={i} badge={0} collapsed={collapsed} />)}
        {isAdmin && <Item item={ADMIN_ITEM} badge={0} collapsed={collapsed} />}
      </nav>

      <div className="space-y-1 border-t border-line pt-3">
        <NavLink
          to={PROFILE_ITEM.to}
          aria-label={collapsed ? `Your profile, ${profile?.full_name ?? ''}` : undefined}
          title={collapsed ? (profile?.full_name ?? 'Profile') : undefined}
          className={cn('flex items-center rounded-2xl py-2 hover:bg-mint/70', collapsed ? 'justify-center px-0' : 'gap-3 px-2')}
        >
          <Avatar path={profile?.avatar_path} name={profile?.full_name} size={36} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{profile?.full_name}</span>
              <span className="block truncate text-xs text-muted">@{profile?.username}</span>
            </span>
          )}
        </NavLink>

        <NavLink
          to="/theme"
          aria-label={collapsed ? 'Settings' : undefined}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) => rowClass(isActive)}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && 'Settings'}
        </NavLink>

        <div className={cn('flex gap-1', collapsed ? 'flex-col items-center' : 'items-center')}>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label={collapsed ? 'Log out' : undefined}
            title={collapsed ? 'Log out' : undefined}
            className={cn(rowClass(), collapsed ? 'w-full' : 'min-w-0 flex-1')}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && 'Log out'}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
