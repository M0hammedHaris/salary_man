'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBills } from '@/lib/actions/bills';
import { format, isToday, isTomorrow, isWithinInterval, addDays } from 'date-fns';
import { Calendar, Clock, AlertTriangle, DollarSign, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface Bill {
  id: string;
  name: string;
  amount: string;
  nextDueDate: string | Date;
  reminderDays: string;
  account: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
  } | null;
}

interface UpcomingBillsProps {
  onPayBill?: (billId: string) => void;
  onSetupReminder?: (billId: string) => void;
  className?: string;
}

export function UpcomingBills({ onPayBill, onSetupReminder, className }: UpcomingBillsProps) {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  // Fetch upcoming bills
  const { data: billsResponse, isLoading, error } = useQuery({
    queryKey: ['bills', 'upcoming', timeFilter],
    queryFn: async () => {
      // The API doesn't support 'upcoming' parameter, so we fetch all bills and filter client-side
      const response = await getUserBills();
      return response;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Extract bills array from the response
  const bills = billsResponse?.bills || [];

  const filterBillsByTime = (bills: Bill[]) => {
    const now = new Date();
    const today = new Date();
    const endDate = timeFilter === 'today' ? today :
      timeFilter === 'week' ? addDays(today, 7) :
        addDays(today, 30);

    return bills.filter(bill => {
      const dueDate = new Date(bill.nextDueDate); // Updated to use nextDueDate
      return isWithinInterval(dueDate, { start: now, end: endDate });
    });
  };

  const getBillUrgency = (nextDueDate: string | Date) => {
    const due = new Date(nextDueDate); // Updated parameter name

    if (isToday(due)) return 'today';
    if (isTomorrow(due)) return 'tomorrow';

    const daysUntilDue = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'soon';
    return 'upcoming';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'today': return 'destructive';
      case 'tomorrow': return 'destructive';
      case 'due today': return 'destructive';
      case 'urgent': return 'destructive';
      case 'soon': return 'default';
      default: return 'secondary';
    }
  };

  const getUrgencyText = (urgency: string, nextDueDate: string | Date) => {
    const due = new Date(nextDueDate); // Updated parameter name

    switch (urgency) {
      case 'today': return 'Due Today';
      case 'tomorrow': return 'Due Tomorrow';
      case 'urgent': return `Due ${format(due, 'MMM dd')}`;
      case 'soon': return `Due ${format(due, 'MMM dd')}`;
      default: return format(due, 'MMM dd, yyyy');
    }
  };

  const upcomingBills = bills ? filterBillsByTime(bills) : [];
  const totalAmount = upcomingBills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load upcoming bills. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Bills
          </CardTitle>

          {/* Time Filter */}
          <div className="flex space-x-1">
            {(['today', 'week', 'month'] as const).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className="text-xs"
              >
                {filter === 'today' ? 'Today' :
                  filter === 'week' ? '7 Days' : '30 Days'}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {!isLoading && upcomingBills.length > 0 && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{upcomingBills.length} bills</span>
            <span className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              ₹{totalAmount.toFixed(2)} total
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : upcomingBills.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No bills due in the {timeFilter === 'today' ? 'next day' :
                timeFilter === 'week' ? 'next 7 days' :
                  'next 30 days'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBills.map((bill) => {
              const urgency = getBillUrgency(bill.nextDueDate); // Updated to use nextDueDate
              const urgencyColor = getUrgencyColor(urgency);
              const urgencyText = getUrgencyText(urgency, bill.nextDueDate); // Updated to use nextDueDate

              return (
                <div key={bill.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  {/* Bill Icon/Category */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium truncate">{bill.name}</h4>
                      <Badge variant={urgencyColor} className="text-xs">
                        {urgencyText}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {bill.category?.name || 'Bill Payment'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {bill.account.name}
                      </span>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-semibold">₹{Number(bill.amount).toFixed(2)}</p>
                    <div className="flex space-x-1 mt-1">
                      {onPayBill && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPayBill(bill.id)}
                          className="text-xs h-6"
                        >
                          Pay
                        </Button>
                      )}
                      {onSetupReminder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSetupReminder(bill.id)}
                          className="text-xs h-6 w-6 p-0"
                        >
                          <Bell className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Bills Link */}
        {!isLoading && upcomingBills.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button variant="ghost" className="w-full text-sm" asChild>
              <a href="/bills">View All Bills</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
