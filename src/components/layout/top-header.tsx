"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";


export function TopHeader() {
    const { user } = useUser();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <header className="flex h-20 items-center justify-between px-8 bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 sticky top-0 z-10 border-b border-border">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {getGreeting()}, {user?.firstName || "User"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    Here&apos;s your financial overview for today.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined text-[20px]">
                        search
                    </span>
                    <input
                        className="h-10 w-64 rounded-full border-none bg-white py-2 pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                        placeholder="Search transactions..."
                        type="text"
                    />
                </div>

                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 dark:bg-slate-800 dark:text-white relative border border-border">
                    <span className="material-symbols-outlined text-muted-foreground dark:text-slate-300">
                        notifications
                    </span>
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-800"></span>
                </button>

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
