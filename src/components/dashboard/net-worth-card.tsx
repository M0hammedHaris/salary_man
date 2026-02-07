"use client";

import React from "react";
import { formatCurrency } from '@/lib/utils/decimal';
import { cn } from "@/lib/utils";

interface NetWorthCardProps {
    totalNetWorth: number;
    changePercentage?: number;
}

export function NetWorthCard({ totalNetWorth, changePercentage = 0 }: NetWorthCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 h-full">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent opacity-50 dark:from-blue-900/20"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Net Worth</p>
                        <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {formatCurrency(Math.abs(totalNetWorth)).split('.')[0]}
                            <span className="text-2xl text-slate-400">.{formatCurrency(totalNetWorth).split('.')[1] || '00'}</span>
                        </h3>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
                        changePercentage >= 0
                            ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        <span className="material-symbols-outlined text-[18px]">
                            {changePercentage >= 0 ? "trending_up" : "trending_down"}
                        </span>
                        <span>{changePercentage >= 0 ? "+" : ""}{changePercentage}%</span>
                    </div>
                </div>
                <div className="mt-6 flex items-end gap-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Last updated just now</p>
                </div>
            </div>
        </div>
    );
}
