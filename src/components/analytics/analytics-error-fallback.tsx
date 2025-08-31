"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AnalyticsErrorFallback() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive financial analytics and insights
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Unable to Load Analytics</CardTitle>
          <CardDescription>
            We encountered an error while loading your financial analytics data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please try refreshing the page or contact support if the issue persists.
          </p>
          <Button onClick={handleRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
