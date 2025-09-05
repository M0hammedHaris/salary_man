"use client";

import React from "react";
import Link from "next/link";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "./animated-nav";

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
  showSubtext?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal";
}

const sizeClasses = {
  sm: {
    container: "h-8 w-8",
    icon: "h-4 w-4",
    text: "text-base",
    subtext: "text-xs",
    indicator: "h-2 w-2",
  },
  md: {
    container: "h-10 w-10",
    icon: "h-5 w-5",
    text: "text-lg",
    subtext: "text-xs",
    indicator: "h-3 w-3",
  },
  lg: {
    container: "h-12 w-12",
    icon: "h-6 w-6",
    text: "text-xl",
    subtext: "text-sm",
    indicator: "h-3 w-3",
  },
};

export function Logo({
  href = "/dashboard",
  className,
  showText = true,
  showSubtext = false,
  size = "md",
  variant = "default",
}: LogoProps) {
  const sizes = sizeClasses[size];
  
  const logoElement = (
    <AnimatedLogo className={className}>
      <div className="flex items-center space-x-3">
        <div className={cn(
          "relative flex items-center justify-center rounded-xl shadow-sm transition-all duration-200",
          sizes.container,
          variant === "default" 
            ? "bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            : "bg-primary hover:bg-primary/90"
        )}>
          <DollarSign className={cn(sizes.icon, "text-primary-foreground transition-transform duration-200 group-hover:rotate-12")} />
          {variant === "default" && (
            <div className={cn(
              "absolute -top-1 -right-1 rounded-full bg-green-500 border-2 border-background transition-all duration-200 hover:bg-green-400",
              sizes.indicator
            )}>
              <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-75" />
            </div>
          )}
        </div>
        
        {showText && (
          <div className="hidden flex-col sm:flex">
            <span className={cn("font-bold tracking-tight transition-colors duration-200 hover:text-primary", sizes.text)}>
              SalaryMan
            </span>
            {showSubtext && (
              <span className={cn("text-muted-foreground transition-colors duration-200", sizes.subtext)}>
                Financial Manager
              </span>
            )}
          </div>
        )}
      </div>
    </AnimatedLogo>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        {logoElement}
      </Link>
    );
  }

  return <div className="group">{logoElement}</div>;
}

// Additional preset components for common use cases
export function HeaderLogo(props: Omit<LogoProps, "size" | "showSubtext">) {
  return <Logo {...props} size="md" showSubtext />;
}

export function CompactLogo(props: Omit<LogoProps, "size" | "showText" | "showSubtext">) {
  return <Logo {...props} size="sm" showText={false} showSubtext={false} variant="minimal" />;
}

export function BrandLogo(props: Omit<LogoProps, "size">) {
  return <Logo {...props} size="lg" />;
}
