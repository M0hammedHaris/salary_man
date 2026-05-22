"use client";

/**
 * @file top-header.tsx
 * @description Sticky top-of-page application header for authenticated pages.
 *
 * Rendered by `<ConditionalNavigationHeader />` on every protected route.
 * Sits in a `h-20` sticky bar that aligns with the sidebar brand-header height.
 *
 * Contents (left → right):
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Greeting + subtitle │ [Search input] │ [Bell] │ [UserButton]  │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * The search input is hidden on `sm:` and below to preserve mobile header space.
 * On mobile, search is expected to be available within individual page views.
 *
 * Accessibility changes:
 *   - `aria-label="Search transactions"` added to the search input so screen
 *     readers announce the field purpose (no visible <label> is present).
 *   - `aria-label="View notifications"` added to the icon-only bell button so
 *     the action is announced to assistive technology users.
 */

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";


export function TopHeader() {
    const { user } = useUser();

    /**
     * Returns a time-appropriate greeting string.
     * Used in the welcome message at the top of the dashboard.
     */
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <header className="flex h-20 items-center justify-between px-8 bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 sticky top-0 z-50 border-b border-border">
            {/* ── Left: personalised greeting ──────────────────────────── */}
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {getGreeting()}, {user?.firstName || "User"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    Here&apos;s your financial overview for today.
                </p>
            </div>

            {/* ── Right: search, notifications, user avatar ─────────────── */}
            <div className="flex items-center gap-4">
                {/*
                  Search input — hidden on small screens to preserve header space.
                  `aria-label` provides an accessible name because there is no
                  visible <label> element associated with this input.
                */}
                <div className="relative hidden sm:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined text-[20px]">
                        search
                    </span>
                    <input
                        aria-label="Search transactions"
                        className="h-10 w-64 rounded-full border-none bg-white py-2 pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                        placeholder="Search transactions..."
                        type="text"
                    />
                </div>

                {/*
                  Notification bell — icon-only button.
                  `aria-label` is required for screen readers as there is no
                  visible text label. The red dot is a decorative online-indicator
                  and is not conveyed to assistive technology (acceptable: the
                  notifications page itself provides the full list).
                */}
                <button aria-label="View notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 dark:bg-slate-800 dark:text-white relative border border-border">
                    <span className="material-symbols-outlined text-muted-foreground dark:text-slate-300">
                        notifications
                    </span>
                    {/* Unread indicator dot — decorative, not announced to screen readers */}
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-800"></span>
                </button>

                {/* Clerk UserButton — handles avatar, profile, and sign-out natively */}
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm dark:border-slate-700">
                    <UserButton
                        afterSignOutUrl="/sign-in"
                        appearance={{
                            elements: {
                                avatarBox: "h-full w-full",
                            },
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
