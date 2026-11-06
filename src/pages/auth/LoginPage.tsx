import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { OtpForm } from './OtpForm';

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in with your VIT student email.">
      <OtpForm mode="login" />
      <p className="text-center text-sm text-muted">
        New here? <Link to="/signup" className="font-semibold text-forest hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
