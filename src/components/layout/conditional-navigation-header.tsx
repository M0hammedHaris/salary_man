"use client";

import { usePathname } from "next/navigation";
import { TopHeader } from "./top-header";

export function ConditionalNavigationHeader() {
  const pathname = usePathname();

  // Don't show navigation on landing page (root path)
  const shouldShowNavigation = pathname !== '/';

  if (!shouldShowNavigation) {
    return null;
  }

  return <TopHeader />;
}
