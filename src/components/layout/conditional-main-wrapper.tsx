"use client";

/**
 * @file conditional-main-wrapper.tsx
 * @description Layout wrapper that conditionally applies the authenticated shell.
 *
 * Authenticated pages (everything except `/`) are rendered inside a flex row
 * that contains:
 *   - `<Sidebar />` — desktop-only left navigation (hidden below `lg` breakpoint)
 *   - `<main>`     — primary content area
 *
 * The landing page (`/`) bypasses this wrapper entirely so it can control its
 * own full-bleed layout without sidebar chrome.
 *
 * `pb-20 lg:pb-0` on `<main>`:
 *   On mobile the fixed `<MobileBottomNav />` (48px tall + padding) sits over
 *   the bottom of the page. `pb-20` (80px) adds enough clearance so the last
 *   item of any scrollable list is never obscured by the nav bar.
 *   On `lg+` the desktop sidebar is used instead, so the bottom padding is
 *   removed (`lg:pb-0`) to avoid unnecessary whitespace.
 */

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

interface ConditionalMainWrapperProps {
  children: React.ReactNode;
}

export function ConditionalMainWrapper({ children }: ConditionalMainWrapperProps) {
  const pathname = usePathname();

  // The landing page manages its own layout — skip the authenticated shell
  const isLandingPage = pathname === '/';

  if (!isLandingPage) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop sidebar — hidden below lg breakpoint via CSS */}
        <Sidebar />

        {/*
          pb-20: clearance for the fixed mobile bottom nav bar (MobileBottomNav).
          lg:pb-0: remove clearance on desktop where the sidebar nav is used instead.
        */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    );
  }

  // Landing page — render children with no surrounding chrome
  return <>{children}</>;
}
