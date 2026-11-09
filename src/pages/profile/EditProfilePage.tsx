import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Feedback';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { PrivacyPanel } from '@/components/profile/PrivacyPanel';
import { useAuth } from '@/store/authStore';
import { toast } from '@/store/uiStore';

export default function EditProfilePage() {
  const profile = useAuth((s) => s.profile);
  const setProfile = useAuth((s) => s.setProfile);
  const navigate = useNavigate();

  if (!profile) return <Spinner label="Loading your profile" />;

  return (
    <div className="space-y-6">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to profile
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-forest sm:text-3xl">Edit profile</h1>
        <p className="text-sm text-muted">Update your details, photo and what others can see.</p>
      </div>

      <Card>
        <ProfileForm
          mode="edit"
          initial={profile}
          onSaved={(saved) => {
            setProfile(saved);
            toast.success('Profile updated.');
            navigate('/profile');
          }}
          onCancel={() => navigate('/profile')}
        />
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest" aria-hidden="true"><Palette className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-forest">Appearance &amp; Themes</h2>
            <p className="text-sm text-muted">Pick one of six themes for your Campusly.</p>
          </div>
          <Link to="/theme" className="shrink-0 text-sm font-semibold text-forest hover:underline">Open theme</Link>
        </div>
      </Card>

      <PrivacyPanel />
    </div>
  );
}