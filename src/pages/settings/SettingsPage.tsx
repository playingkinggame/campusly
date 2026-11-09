import { Link } from 'react-router-dom';
import { ChevronRight, UserCog } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { AppearancePanel } from '@/components/theme/AppearancePanel';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">Theme</h1>
        <p className="text-sm text-muted">Choose how Campusly looks and feels.</p>
      </div>

      <Card>
        <AppearancePanel />
      </Card>

      <Link
        to="/profile/edit"
        className="glass flex items-center gap-3 p-4 transition-colors hover:border-forest/40 sm:p-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest" aria-hidden="true">
          <UserCog className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Profile and privacy</span>
          <span className="block text-sm text-muted">Edit your details, photo, online status and blocked people.</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      </Link>
    </div>
  );
}