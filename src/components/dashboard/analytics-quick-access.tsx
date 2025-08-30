"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalyticsQuickAccessProps {
  className?: string;
}

export function AnalyticsQuickAccess({ className }: AnalyticsQuickAccessProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Analytics</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            New
          </Badge>
        </div>
        <CardDescription>
          Get insights into your financial patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Preview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              This Month
            </p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold">+12.5%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Savings Rate
            </p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold">18.3%</span>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Interactive cash flow charts
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Spending breakdown by category
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Net worth tracking & trends
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full">
          <Link href="/analytics" className="flex items-center gap-2">
            View Full Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
