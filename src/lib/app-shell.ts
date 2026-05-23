/**
 * @file app-shell.ts
 * @description Shared route helpers for deciding when the authenticated app
 * shell should render.
 *
 * Native-like PWAs should keep public onboarding/auth routes visually separate
 * from the signed-in application shell. This helper prevents public routes from
 * inheriting in-app chrome such as the top header, sidebar, and bottom tabs.
 */

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up'] as const;

/**
 * Returns true when a route belongs to the signed-in app shell.
 * Nested Clerk routes like `/sign-in/...` and `/sign-up/...` stay public too.
 */
export function shouldUseAuthenticatedAppShell(pathname: string): boolean {
  return !PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
