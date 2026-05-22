import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ConditionalNavigationHeader } from '@/components/layout/conditional-navigation-header';
import { ConditionalMainWrapper } from '@/components/layout/conditional-main-wrapper';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { NotificationProvider } from '@/components/alerts/notification-provider';
import { RealTimeNotificationProvider } from '@/components/notifications/real-time-notification-provider';
import { PWARegistration } from '@/components/pwa/pwa-registration';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

/**
 * @file layout.tsx
 * @description Root layout for the entire application.
 *
 * Responsibilities:
 * - Declares global HTML shell (lang, fonts, head links)
 * - Exports Next.js `metadata` and `viewport` objects
 * - Wraps every page in the provider tree:
 *     ClerkProvider → Providers (QueryClient + Theme) → NotificationProvider
 *     → RealTimeNotificationProvider
 * - Renders shared layout chrome: navigation header, sidebar wrapper,
 *   mobile bottom nav, toast notifications, PWA registration, analytics
 *
 * Accessibility / PWA changes:
 * - Removed `maximumScale: 1` and `userScalable: false` from viewport.
 *   These settings violate WCAG 1.4.4 (Resize Text, Level AA) by preventing
 *   users with low vision from pinch-zooming the page.
 * - Added `viewportFit: "cover"` so the app renders edge-to-edge on notched
 *   devices (iPhone Dynamic Island, etc.) matching native app behaviour.
 * - Added <MobileBottomNav /> — persistent bottom tab bar for mobile users
 *   (hidden on lg+ breakpoints where the sidebar is shown instead).
 */

// ─── Font Configuration ──────────────────────────────────────────────────────

/** Primary sans-serif font used for body text and UI labels. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Prevent FOIT — show fallback text until Geist loads
  preload: true,
});

/** Monospace font used for code snippets and numeric displays. Lazy-loaded
 *  because it is not needed on the critical rendering path. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

/** Display font used for headings throughout the dashboard. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ['400', '600', '700', '800'], // Only load the weights actually used
  display: 'swap',
  preload: true,
});

// ─── Next.js Metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "SalaryMan - Personal Finance Manager",
  description: "Secure personal finance management with comprehensive tracking and insights",
  // Links the PWA web app manifest for installability
  manifest: "/manifest.json",
  // iOS home-screen add-to-home-screen support
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SalaryMan"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" }
    ]
  }
};

/**
 * Viewport export — kept separate from `metadata` as required by Next.js 14+.
 *
 * NOTE: `maximumScale` and `userScalable` are intentionally omitted.
 * Disabling user scaling violates WCAG Success Criterion 1.4.4 (Level AA).
 * `viewportFit: "cover"` enables content to extend into notched safe areas
 * and is required for a true full-bleed native-app feel on modern iPhones.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Warm-up the Google Fonts CDN connection before the stylesheet request */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/*
            Material Symbols Outlined — variable icon font loaded from Google CDN.
            Used alongside lucide-react for certain UI elements (sidebar icons, etc.).
            The `opsz,wght,FILL,GRAD` axes enable arbitrary size/weight/fill customisation.
          */}
          <link 
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" 
            rel="stylesheet"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased font-sans`}
        >
          {/* ClerkProvider → Providers → NotificationProviders supply the full context tree */}
          <Providers>
            <NotificationProvider>
              <RealTimeNotificationProvider>
                {/* Registers the service worker and listens for PWA update events */}
                <PWARegistration />

                {/* Sticky top bar shown on all non-landing pages */}
                <ConditionalNavigationHeader />

                {/*
                  Conditionally wraps authenticated pages with the desktop sidebar
                  and a <main> element. Landing page (/) renders children directly.
                */}
                <ConditionalMainWrapper>
                  {children}
                </ConditionalMainWrapper>

                {/* Global toast notification system — positioned top-right */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    className: 'border shadow-lg',
                  }}
                />

                {/*
                  Mobile bottom tab navigation — hidden on lg+ screens where the
                  desktop sidebar takes over. Renders 5 primary nav destinations
                  as a persistent bottom bar matching native app conventions.
                */}
                <MobileBottomNav />
               </RealTimeNotificationProvider>
            </NotificationProvider>
          </Providers>

          {/* Vercel Speed Insights — performance monitoring (production only) */}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
