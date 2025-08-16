"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route-to-breadcrumb mapping
const routeToBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [],
  '/accounts': [
    { label: 'Accounts', current: true }
  ],
  '/transactions': [
    { label: 'Transactions', current: true }
  ],
  '/profile': [
    { label: 'Profile', current: true }
  ],
};

export function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
  const pathname = usePathname();
  
  // Use provided items or generate from pathname
  const breadcrumbItems = items || routeToBreadcrumbs[pathname] || [
    { label: 'Page', current: true }
  ];

  // Don't show breadcrumbs for dashboard root
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList>
          {/* Home Icon for Dashboard */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex items-center">
                <Home className="h-4 w-4" />
                <span className="sr-only">Dashboard</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.current ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href!}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export type { BreadcrumbItem };
