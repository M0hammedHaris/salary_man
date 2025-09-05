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
import { HeaderLogo } from "@/components/ui/logo";
import { AnimatedNavItem } from "@/components/ui/animated-nav";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  User,
  Menu,
  Bell,
  BarChart3,
  Target,
  FileText,
} from "lucide-react";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  useStatusIndicator?: boolean;
}

// Primary navigation - core financial features
const primaryNavigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of your finances",
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
    label: "Bills",
    href: "/bills",
    icon: FileText,
    description: "Manage bill payments and reminders",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Financial insights and trends",
  },
  {
    label: "Savings",
    href: "/savings",
    icon: Target,
    description: "Track savings goals and planning",
  },
];

// Profile and settings navigation
const profileNavigationItems: NavigationItem[] = [
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
    <div className="min-h-0">
      <nav className="fixed top-6 inset-x-4 h-16 bg-background border dark:border-slate-700/70 max-w-screen-xl mx-auto rounded-full z-50 shadow-lg">
        <div className="h-full flex items-center justify-between mx-auto px-6">
          {/* Enhanced Logo/Brand */}
          <div className="mr-4">
            <HeaderLogo />
          </div>

          {/* Enhanced Desktop Navigation - All Core Features Visible */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              {primaryNavigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <AnimatedNavItem isActive={isActive(item.href)}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "h-10 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-full border-2 border-transparent",
                        isActive(item.href) 
                          ? "bg-accent text-accent-foreground shadow-sm border-primary" 
                          : "hover:bg-accent/50 hover:text-accent-foreground hover:border-accent"
                      )}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      href={item.href}
                    >
                      <div className="flex items-center space-x-2">
                        {item.useStatusIndicator ? (
                          <NotificationStatusIndicator className="h-4 w-4" />
                        ) : (
                          <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        )}
                        <span className="hidden xl:inline">{item.label}</span>
                      </div>
                    </NavigationMenuLink>
                  </AnimatedNavItem>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Action buttons and user profile */}
          <div className="flex items-center gap-3">
            {/* Enhanced Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group relative h-10 w-10 rounded-full border border-border/50 hover:border-border hover:bg-accent transition-all duration-200 lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="border-b border-border/40 p-6">
                  <SheetTitle>
                    <HeaderLogo />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col space-y-2 p-6">
                  {/* All Primary Navigation Items */}
                  {primaryNavigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center space-x-4 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground min-h-[56px] border border-transparent",
                        isActive(item.href) && "bg-accent text-accent-foreground border-accent shadow-sm"
                      )}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 border",
                        isActive(item.href) 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : "bg-background border-border group-hover:bg-accent group-hover:border-accent"
                      )}>
                        {item.useStatusIndicator ? (
                          <NotificationStatusIndicator className="h-4 w-4" />
                        ) : (
                          <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="transition-colors duration-200">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {isActive(item.href) && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </Link>
                  ))}
                  
                  {/* Divider */}
                  <div className="border-t border-border/50 my-2" />
                  
                  {/* Profile and Settings */}
                  {profileNavigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center space-x-4 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground min-h-[56px] border border-transparent",
                        isActive(item.href) && "bg-accent text-accent-foreground border-accent shadow-sm"
                      )}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 border",
                        isActive(item.href) 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : "bg-background border-border group-hover:bg-accent group-hover:border-accent"
                      )}>
                        {item.useStatusIndicator ? (
                          <NotificationStatusIndicator className="h-4 w-4" />
                        ) : (
                          <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="transition-colors duration-200">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {isActive(item.href) && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </Link>
                  ))}

                  {/* Profile Link */}
                  <Link
                    href="/profile"
                    className={cn(
                      "group flex items-center space-x-4 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground min-h-[56px] border border-transparent",
                      isActive("/profile") && "bg-accent text-accent-foreground border-accent shadow-sm"
                    )}
                    aria-current={isActive("/profile") ? "page" : undefined}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 border",
                      isActive("/profile") 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-background border-border group-hover:bg-accent group-hover:border-accent"
                    )}>
                      <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    </div>
                    <div className="flex flex-col">
                      <span className="transition-colors duration-200">Profile</span>
                      <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                        Account settings and preferences
                      </span>
                    </div>
                    {isActive("/profile") && (
                      <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {/* Notifications Button - Clear and Accessible */}
            <Link
              href="/dashboard/notifications"
              className={cn(
                "hidden lg:flex group relative h-10 w-10 rounded-full border border-border/50 hover:border-border hover:bg-accent transition-all duration-200 items-center justify-center",
                isActive("/dashboard/notifications") && "bg-accent border-accent"
              )}
              aria-label="View notifications"
            >
              <NotificationStatusIndicator className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="sr-only">Notifications</span>
            </Link>

            {/* Enhanced User Profile */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm hover:bg-accent/50">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 rounded-full transition-all duration-200 group-hover:scale-105",
                    userButtonPopoverCard: "bg-background border border-border shadow-xl rounded-xl mt-2",
                    userButtonPopoverActionButton: "hover:bg-accent transition-colors duration-200 rounded-lg mx-1",
                    userButtonPopoverActionButtonText: "text-sm font-medium",
                    userButtonPopoverFooter: "hidden"
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
