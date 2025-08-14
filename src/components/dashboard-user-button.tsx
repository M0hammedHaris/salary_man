'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';

export function DashboardUserButton() {
  const { user } = useUser();
  
  return (
    <div className="flex items-center gap-3">
      {user && (
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Premium
          </Badge>
        </div>
      )}
      <UserButton 
        afterSignOutUrl="/" 
        appearance={{
          elements: {
            avatarBox: "size-8",
          }
        }}
      />
    </div>
  );
}
