/**
 * @file proxy.ts
 * @description Next.js 16 network proxy — replaces the former `middleware.ts`.
 *
 * In Next.js 16, `middleware.ts` was deprecated in favour of `proxy.ts` to
 * make the network boundary and request-interception layer more explicit.
 * Key differences from `middleware.ts`:
 *   - File is named `proxy.ts` (not `middleware.ts`)
 *   - Runs on the Node.js runtime (not the Edge runtime by default)
 *
 * This proxy uses Clerk's `clerkMiddleware` helper to enforce authentication
 * on all protected routes before the request reaches any page or API handler.
 *
 * Protected routes (require a signed-in Clerk session):
 *   /dashboard/**  /profile/**  /accounts/**
 *   /transactions/**  /goals/**  /settings/**
 *
 * Public routes (no auth required):
 *   /  /sign-in  /sign-up  all static assets  all _next internals
 *
 * The `matcher` config tells Next.js which requests this proxy runs on:
 *   - Skips _next internals and common static file extensions for performance
 *   - Always runs on /api and /trpc routes regardless of file extension
 *
 * @see src/middleware.ts — deprecated stub kept for backwards compatibility
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Route matcher for pages that require an authenticated Clerk session.
 * Any request matching these patterns will be redirected to /sign-in
 * if the user does not have a valid session.
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/accounts(.*)',
  '/transactions(.*)',
  '/goals(.*)',
  '/settings(.*)',
]);

/**
 * The proxy function — runs before every matched request.
 * `clerkMiddleware` wraps the handler and injects auth helpers.
 * `auth.protect()` throws a redirect to the Clerk sign-in page when the
 * user has no valid session on a protected route.
 */
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

/**
 * Matcher configuration — controls which requests invoke this proxy.
 *
 * Pattern 1: All routes except _next internals and static assets.
 *   The negative lookahead skips Next.js framework files and known static
 *   extensions so the proxy only runs on meaningful application routes.
 *
 * Pattern 2: Always run on /api and /trpc routes regardless of extension.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
