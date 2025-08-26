"use client";

import { usePathname } from "next/navigation";
import { NavigationHeader } from "./navigation-header";

export function ConditionalNavigationHeader() {
  const pathname = usePathname();
  
  // Don't show navigation on landing page (root path)
  const shouldShowNavigation = pathname !== '/';

  if (!shouldShowNavigation) {
    return null;
  }

  return <NavigationHeader />;
}
