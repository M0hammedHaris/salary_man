'use client';

import { UserButton } from '@clerk/nextjs';

export function DashboardUserButton() {
  return <UserButton afterSignOutUrl="/" />;
}
