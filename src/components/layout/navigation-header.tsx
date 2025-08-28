"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { NotificationStatusIndicator } from "@/components/notifications/notification-status-indicator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  User,
  Menu,
  DollarSign,
  Bell,
  BarChart3,
} from "lucide-react";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  useStatusIndicator?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of your finances",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Financial insights and trends",
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: CreditCard,
    description: "Manage bank accounts and cards",
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: Receipt,
    description: "View and manage transactions",
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    description: "Notification center and alerts",
    useStatusIndicator: true,
  },
  {
    label: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
    description: "Credit card usage alerts",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    description: "Account settings and preferences",
  },
];

export function NavigationHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo/Brand */}
        <div className="mr-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="hidden font-bold sm:inline-block">SalaryMan</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  href={item.href}
                >
                  {item.useStatusIndicator ? (
                    <NotificationStatusIndicator className="mr-2" />
                  ) : (
                    <item.icon className="mr-2 h-4 w-4" />
                  )}
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle>
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span className="font-bold">SalaryMan</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      isActive(item.href) && "bg-accent text-accent-foreground"
                    )}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.useStatusIndicator ? (
                      <NotificationStatusIndicator />
                    ) : (
                      <item.icon className="h-4 w-4" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Spacer */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none" />

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "bg-background border border-border",
                  userButtonPopoverActionButton: "hover:bg-accent",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
