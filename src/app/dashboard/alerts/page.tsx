import { Suspense } from 'react';
import { AlertCenter } from '@/components/alerts/alert-center';
import { NotificationSettings } from '@/components/alerts/notification-settings';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Card Alerts</h1>
          <p className="text-muted-foreground">
            Monitor your credit card usage and manage alert settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense 
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AlertCenter />
          </Suspense>
        </div>
        
        <div className="lg:col-span-1">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <NotificationSettings />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
