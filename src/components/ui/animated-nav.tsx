"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedNavItemProps {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export function AnimatedNavItem({ children, isActive, className }: AnimatedNavItemProps) {
  return (
    <div
      className={cn(
        "relative transform transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {children}
      {isActive && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-in slide-in-from-left-full duration-300" />
      )}
    </div>
  );
}

interface AnimatedLogoProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedLogo({ children, className }: AnimatedLogoProps) {
  return (
    <div
      className={cn(
        "relative transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95",
        className
      )}
    >
      {children}
    </div>
  );
}
