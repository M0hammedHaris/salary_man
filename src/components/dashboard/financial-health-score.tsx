"use client";

import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface FinancialHealthScoreProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  explanation?: string;
}

export function FinancialHealthScore({ score, trend: _trend, explanation }: FinancialHealthScoreProps) {
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#e0f7fa] to-[#e1bee7] p-[2px] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:from-cyan-900 dark:to-purple-900 h-full">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[22px] bg-white p-6 dark:bg-slate-800">
        <div className="flex items-center justify-between w-full mb-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Financial Health Score</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{explanation}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="relative flex items-center justify-center py-4">
          {/* Circular Progress SVG */}
          <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              className="dark:stroke-slate-700"
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="#f1f5f9"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="url(#score-gradient)"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="8"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3c83f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{score}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">
              {getScoreLabel(score)}
            </span>
          </div>
        </div>

        <button className="mt-4 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
}
