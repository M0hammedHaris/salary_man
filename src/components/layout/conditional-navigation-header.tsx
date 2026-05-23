"use client";

import { usePathname } from "next/navigation";
import { shouldUseAuthenticatedAppShell } from "@/lib/app-shell";
import { TopHeader } from "./top-header";

export function ConditionalNavigationHeader() {
  const pathname = usePathname();

  // Only authenticated app routes should render the sticky top header.
  const shouldShowNavigation = shouldUseAuthenticatedAppShell(pathname);

  if (!shouldShowNavigation) {
    return null;
  }

  return <TopHeader />;
}
