import { Hammer } from 'lucide-react';
import { EmptyState } from '@/components/ui/Feedback';

/** Placeholder for screens that arrive in later batches. Each batch replaces its routes in App.tsx. */
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-forest">{title}</h1>
      <EmptyState icon={<Hammer className="h-6 w-6" />} title="Coming in the next batch" text="This screen is built in a later batch of the delivery plan." />
    </div>
  );
}
