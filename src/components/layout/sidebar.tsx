"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";

interface SidebarItem {
    label: string;
    href: string;
    icon: string; // Material Symbols name
}

const sidebarItems: SidebarItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
    },
    {
        label: "Transactions",
        href: "/transactions",
        icon: "receipt_long",
    },
    {
        label: "Budget",
        href: "/analytics",
        icon: "pie_chart",
    },
    {
        label: "Goals",
        href: "/savings",
        icon: "track_changes",
    },
    {
        label: "Cards",
        href: "/accounts",
        icon: "credit_card",
    },
];

export function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-white dark:bg-slate-900 h-screen sticky top-0">
            <div className="flex h-20 items-center gap-3 px-6 border-b border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-foreground">SalaryMan</h1>
                    <p className="text-xs font-medium text-muted-foreground">Fintech Dashboard</p>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-4 py-6">
                <nav className="flex flex-col gap-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                                isActive(item.href)
                                    ? "bg-primary text-white shadow-md shadow-primary/20 translate-y-[-2px]"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto flex flex-col gap-1">
                    <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-4 dark:from-slate-800 dark:to-slate-800/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">PRO Plan</span>
                            <span className="material-symbols-outlined text-indigo-400 text-[18px]">star</span>
                        </div>
                        <p className="text-xs text-indigo-700/80 dark:text-indigo-300 mb-3">Get advanced analytics features.</p>
                        <button className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700">Upgrade</button>
                    </div>

                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                            pathname === "/settings"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Settings</span>
                    </Link>

                    <SignOutButton>
                        <button className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-accent hover:text-foreground w-full text-left">
                            <span className="material-symbols-outlined">logout</span>
                            <span className="text-sm font-medium">Log out</span>
                        </button>
                    </SignOutButton>
                </div>
            </div>
        </aside>
    );
}
