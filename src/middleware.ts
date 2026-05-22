/**
 * @file middleware.ts
 * @deprecated As of Next.js 16, `middleware.ts` is deprecated.
 *
 * The auth proxy logic has been moved to `src/proxy.ts`, which is the
 * Next.js 16 replacement for `middleware.ts`. The export has also been
 * renamed from an anonymous default to a named `proxy` function.
 *
 * This file is kept temporarily to avoid breaking any tooling that still
 * resolves to `middleware.ts`, but it should be deleted once the project
 * has fully validated that `proxy.ts` is working correctly in all
 * environments (local dev, preview deploys, production).
 *
 * TODO: Delete this file after confirming proxy.ts works end-to-end.
 *
 * @see src/proxy.ts — the active Next.js 16 proxy
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/accounts(.*)',
  '/transactions(.*)',
  '/goals(.*)',
  '/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

