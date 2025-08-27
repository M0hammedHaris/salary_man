import { Metadata } from 'next';
import { NotificationCenter } from '@/components/notifications/notification-center';

export const metadata: Metadata = {
  title: 'Notification Center - SalaryMan',
  description: 'Manage all your financial notifications and alerts in one place',
};

export default function NotificationCenterPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your financial notifications and alerts in one place
          </p>
        </div>
        
        <NotificationCenter />
      </div>
    </div>
  );
}
