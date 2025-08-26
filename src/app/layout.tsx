import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ConditionalNavigationHeader } from '@/components/layout/conditional-navigation-header';
import { ConditionalMainWrapper } from '@/components/layout/conditional-main-wrapper';
import { NotificationProvider } from '@/components/alerts/notification-provider';
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
          <NotificationProvider>
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
          </NotificationProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
