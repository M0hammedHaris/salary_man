"use client";

/**
 * @file mobile-bottom-nav.tsx
 * @description Persistent bottom navigation bar for mobile viewports.
 *
 * Renders a fixed bottom tab bar with the 5 primary app destinations.
 * Hidden on `lg` breakpoints and above, where the desktop sidebar
 * (`<Sidebar />`) takes over navigation duties.
 *
 * Design decisions:
 * - `fixed bottom-0` with `z-50` keeps the bar above all page content.
 * - `safe-area-inset-bottom` respects the iPhone home-indicator safe area so
 *   tab labels are never obscured on edge-to-edge displays.
 * - Each tab item uses `min-w-[44px] min-h-[44px]` to satisfy WCAG 2.5.5
 *   (Target Size, Level AA — 44×44 CSS px minimum touch target).
 * - `aria-current="page"` marks the active route for screen readers.
 * - Icons use `aria-hidden="true"` because the visible text label already
 *   conveys the destination; the icon is purely decorative.
 * - The active icon scales up slightly (`scale-110`) and uses a heavier
 *   `strokeWidth` (2.5 vs 1.75) to give clear visual affordance.
 *
 * Content offset:
 * The parent `<main>` in `conditional-main-wrapper.tsx` applies `pb-20 lg:pb-0`
 * so page content is never hidden behind this bar on mobile.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shouldUseAuthenticatedAppShell } from "@/lib/app-shell";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  CreditCard,
} from "lucide-react";

/** Primary navigation destinations shown in the bottom bar. */
const navItems = [
  { href: "/dashboard",    label: "Home",         icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight  },
  { href: "/analytics",    label: "Analytics",    icon: BarChart3       },
  { href: "/savings",      label: "Goals",        icon: PiggyBank       },
  { href: "/accounts",     label: "Accounts",     icon: CreditCard      },
];

export function MobileBottomNav() {
  // usePathname drives the active-state comparison on every route change
  const pathname = usePathname();

  // Public routes should feel like onboarding/auth flows, not the signed-in
  // app shell, so the bottom tab bar stays hidden until after login.
  if (!shouldUseAuthenticatedAppShell(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile navigation"
      // lg:hidden — only visible on mobile/tablet; desktop uses the sidebar
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          // Mark both exact matches and child routes (e.g. /transactions/123) as active
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              // aria-current="page" communicates the active route to assistive technology
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-2 py-1 rounded-xl transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-transform", isActive && "scale-110")}
                // Heavier stroke on active state for visual emphasis
                strokeWidth={isActive ? 2.5 : 1.75}
                // Icon is decorative — text label below conveys the meaning
                aria-hidden="true"
              />
              <span className={cn("text-[10px] font-medium", isActive ? "font-semibold" : "")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
