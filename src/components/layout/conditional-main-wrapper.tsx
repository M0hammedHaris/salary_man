"use client";

import { usePathname } from "next/navigation";

interface ConditionalMainWrapperProps {
  children: React.ReactNode;
}

export function ConditionalMainWrapper({ children }: ConditionalMainWrapperProps) {
  const pathname = usePathname();
  
  // Don't add padding on landing page (root path)
  const shouldAddPadding = pathname !== '/';

  if (shouldAddPadding) {
    return <main className="min-h-screen pt-14">{children}</main>;
  }

  return <>{children}</>;
}
