import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, HardDrive, Scale, Trash2, UserCog } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Field';
import { AppearancePanel } from '@/components/theme/AppearancePanel';
import { deleteAllMyFiles, myStorageUsage } from '@/lib/api/storage';
import { deleteAccount } from '@/lib/api/auth';
import { useAsync } from '@/hooks/useAsync';
import { friendlyError } from '@/lib/errors';
import { fileSizeLabel } from '@/lib/utils';
import { LEGAL_LAST_UPDATED } from '@/lib/legal';
import { toast } from '@/store/uiStore';

const FALLBACK_LIMIT = 100 * 1024 * 1024;

export default function SettingsPage() {
  const navigate = useNavigate();
  const usage = useAsync(myStorageUsage, []);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const used = usage.data?.usedBytes ?? 0;
  const limit = usage.data?.limitBytes || FALLBACK_LIMIT;
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && !busy;

  const closeDelete = () => {
    if (busy) return;
    setDeleteOpen(false);
    setConfirmText('');
    setError(null);
  };

  const removeAccount = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError(null);
    try {
      // Files first: Supabase will not delete an Auth user that still owns storage objects.
      // If a file is already gone we still continue — the account matters more.
      try { await deleteAllMyFiles(); } catch { /* best effort */ }
      await deleteAccount();
      toast.success('Your account and data have been deleted.');
      navigate('/login', { replace: true });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted">Theme, your account, uploads and the legal pages.</p>
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

      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest" aria-hidden="true">
            <HardDrive className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-ink">Uploads</h2>
            <p className="text-sm text-muted">
              Every student gets {fileSizeLabel(limit)} of storage for photos, files and voice notes.
            </p>
            {usage.loading ? (
              <p className="mt-3 text-xs text-muted">Checking your usage…</p>
            ) : usage.data ? (
              <>
                <div
                  className="mt-3 h-2 w-full overflow-hidden rounded-full bg-mint"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label="Storage used"
                >
                  <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {fileSizeLabel(used)} used · {fileSizeLabel(Math.max(0, limit - used))} left
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Your upload limit is {fileSizeLabel(limit)}. Delete files you no longer need to free space.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-1">
        <div className="flex items-start gap-3 pb-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest" aria-hidden="true">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Legal &amp; privacy</h2>
            <p className="text-sm text-muted">Last updated {LEGAL_LAST_UPDATED}.</p>
          </div>
        </div>

        <Link
          to="/privacy"
          className="flex items-center gap-3 rounded-2xl px-2 py-3 text-sm font-semibold text-forest hover:bg-mint/60"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Privacy Policy</span>
          <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
        </Link>
        <Link
          to="/terms"
          className="flex items-center gap-3 rounded-2xl px-2 py-3 text-sm font-semibold text-forest hover:bg-mint/60"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Terms of Service</span>
          <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
        </Link>
      </Card>

      <Card className="border-danger/30">
        <h2 className="text-sm font-semibold text-danger-ink">Delete my account</h2>
        <p className="mt-1 text-sm text-muted">
          Permanently deletes your profile, photo, messages, posts, files and achievements. This cannot be undone.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete my account
        </Button>
      </Card>

      <Modal
        open={deleteOpen}
        title="Delete my account"
        onClose={closeDelete}
        footer={
          <>
            <Button variant="ghost" onClick={closeDelete} disabled={busy}>Cancel</Button>
            <Button variant="danger" loading={busy} disabled={!canDelete} onClick={() => void removeAccount()}>
              Delete forever
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-muted">
          <p>This permanently removes:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>your profile, photo, registration details and achievements;</li>
            <li>your direct and group messages, files and voice notes;</li>
            <li>your posts, events, confessions and study-room notes;</li>
            <li>your connections, notifications and uploaded files.</li>
          </ul>
          <p className="font-semibold text-ink">There is no undo and no way to recover the account.</p>
          <Input
            label="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            disabled={busy}
            placeholder="DELETE"
          />
          {error && <p role="alert" className="rounded-2xl bg-danger/10 px-3 py-2 text-danger-ink">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
