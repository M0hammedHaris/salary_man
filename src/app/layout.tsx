import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ConditionalNavigationHeader } from '@/components/layout/conditional-navigation-header';
import { ConditionalMainWrapper } from '@/components/layout/conditional-main-wrapper';
import { NotificationProvider } from '@/components/alerts/notification-provider';
import { RealTimeNotificationProvider } from '@/components/notifications/real-time-notification-provider';
import { PWARegistration } from '@/components/pwa/pwa-registration';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "SalaryMan - Personal Finance Manager",
  description: "Secure personal finance management with comprehensive tracking and insights",
  manifest: "/manifest.json",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased font-sans`}
        >
          <Providers>
            <NotificationProvider>
              <RealTimeNotificationProvider>
                <PWARegistration />
                <ConditionalNavigationHeader />
                <ConditionalMainWrapper>
                  {children}
                </ConditionalMainWrapper>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    className: 'border shadow-lg',
                  }}
                />
              </RealTimeNotificationProvider>
            </NotificationProvider>
          </Providers>
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
