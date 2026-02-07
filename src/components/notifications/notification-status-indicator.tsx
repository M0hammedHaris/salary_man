'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from './real-time-notification-provider';

interface NotificationStatusProps {
  className?: string;
}

export function NotificationStatusIndicator({ className }: NotificationStatusProps) {
  const { unreadCount } = useRealTimeNotifications();
  const isVisible = true;

  return (
    <Link href="/dashboard/notifications">
      <div className={`relative ${className} cursor-pointer hover:opacity-80 transition-opacity`}>
        <Bell className="h-4 w-4" />
        {isVisible && unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-in fade-in duration-200"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    </Link>
  );
}
