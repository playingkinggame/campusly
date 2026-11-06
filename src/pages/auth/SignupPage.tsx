import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { OtpForm } from './OtpForm';

export default function SignupPage() {
  return (
    <AuthLayout title="Join Campusly" subtitle="Only @vitstudent.ac.in emails can join. It takes one minute.">
      <OtpForm mode="signup" />
      <p className="text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-semibold text-forest hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
