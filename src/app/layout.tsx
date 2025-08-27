import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ConditionalNavigationHeader } from '@/components/layout/conditional-navigation-header';
import { ConditionalMainWrapper } from '@/components/layout/conditional-main-wrapper';
import { NotificationProvider } from '@/components/alerts/notification-provider';
import { RealTimeNotificationProvider } from '@/components/notifications/real-time-notification-provider';
import { PWARegistration } from '@/components/pwa/pwa-registration';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SalaryMan - Personal Finance Manager",
  description: "Secure personal finance management with comprehensive tracking and insights",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
        </body>
      </html>
    </ClerkProvider>
  );
}
