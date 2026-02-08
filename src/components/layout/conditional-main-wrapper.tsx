"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

interface ConditionalMainWrapperProps {
  children: React.ReactNode;
}

export function ConditionalMainWrapper({ children }: ConditionalMainWrapperProps) {
  const pathname = usePathname();

  // Don't add padding/sidebar on landing page (root path)
  const isLandingPage = pathname === '/';

  if (!isLandingPage) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
