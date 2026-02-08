'use client';

import { useState } from 'react';
import { Plus, Calendar, AlertTriangle, DollarSign, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BillSetupForm } from './bill-setup-form';
import { BillReminderSettings } from './bill-reminder-settings';
import { PaymentConfirmation } from './payment-confirmation';
import { displayCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { getUserBills, deleteBill } from '@/lib/actions/bills';
import { getBillDashboardSummary } from '@/lib/actions/dashboard';

interface Bill {
  id: string;
  name: string;
  amount: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  isActive: boolean;
  account: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
  };
}


export function BillCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showReminderSettings, setShowReminderSettings] = useState<string | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState<string | null>(null);

  // Fetch bills overview
  const { data: bills, isLoading: billsLoading, error: billsError, refetch: refetchBills } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const { bills } = await getUserBills();
      // Ensure dates are strings or Date objects as expected by the interface
      return bills as unknown as Bill[];
    },
  });

  // Fetch dashboard summary
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['bills-dashboard'],
    queryFn: async () => {
      return await getBillDashboardSummary();
    },
  });

  const dashboard = dashboardData?.summary;

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowBillForm(true);
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteBill(billId);
      refetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const getBillStatus = (bill: Bill) => {
    const dueDate = new Date(bill.nextDueDate);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    if (bill.status === 'overdue' || isBefore(dueDate, today)) {
      return { variant: 'destructive' as const, label: 'Overdue' };
    }

    if (isBefore(dueDate, threeDaysFromNow)) {
      return { variant: 'secondary' as const, label: 'Due Soon' };
    }

    return { variant: 'outline' as const, label: 'Scheduled' };
  };

  const upcomingBills = bills?.filter(bill => {
    const dueDate = new Date(bill.nextDueDate);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isAfter(dueDate, new Date()) && isBefore(dueDate, sevenDaysFromNow);
  }) || [];

  const overdueBills = bills?.filter(bill => {
    const dueDate = new Date(bill.nextDueDate);
    return bill.status === 'overdue' || isBefore(dueDate, new Date());
  }) || [];

  if (billsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load bills. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bill Management</h1>
          <p className="text-muted-foreground">
            Manage your recurring bills and payment reminders
          </p>
        </div>
        <Button onClick={() => setShowBillForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bills</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? <Skeleton className="h-8 w-12" /> : dashboard?.upcomingBills || 0}
            </div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {dashboardLoading ? <Skeleton className="h-8 w-12" /> : dashboard?.overdueBills || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                displayCurrency(dashboard?.totalAmountDue || '0')
              )}
            </div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Bill Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : dashboard?.nextBillDue ? (
              <>
                <div className="text-lg font-semibold">{dashboard.nextBillDue.name}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboard.nextBillDue.daysUntilDue === 0
                    ? 'Due today'
                    : `${dashboard.nextBillDue.daysUntilDue} days`}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No upcoming bills</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bills Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="justify-start w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="all">All Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Actions for Overdue Bills */}
          {overdueBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Overdue Bills - Immediate Action Required</CardTitle>
                <CardDescription>
                  These bills are past their due date and may incur late fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{bill.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {displayCurrency(bill.amount)} • Due {formatDistanceToNow(new Date(bill.nextDueDate), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowPaymentConfirmation(bill.id)}
                    >
                      Mark as Paid
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bills Preview */}
          {upcomingBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bills (Next 7 Days)</CardTitle>
                <CardDescription>
                  Bills due in the next week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingBills.slice(0, 5).map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{bill.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {displayCurrency(bill.amount)} • Due {formatDistanceToNow(new Date(bill.nextDueDate), { addSuffix: true })}
                      </div>
                    </div>
                    <Badge {...getBillStatus(bill)}>
                      {getBillStatus(bill).label}
                    </Badge>
                  </div>
                ))}
                {upcomingBills.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => setActiveTab('upcoming')}>
                      View All {upcomingBills.length} Upcoming Bills
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <BillsList
            bills={upcomingBills}
            title="Upcoming Bills"
            emptyMessage="No bills due in the next 7 days"
            onEdit={handleEditBill}
            onDelete={handleDeleteBill}
            onMarkPaid={setShowPaymentConfirmation}
            onSettings={setShowReminderSettings}
            loading={billsLoading}
          />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <BillsList
            bills={overdueBills}
            title="Overdue Bills"
            emptyMessage="No overdue bills"
            onEdit={handleEditBill}
            onDelete={handleDeleteBill}
            onMarkPaid={setShowPaymentConfirmation}
            onSettings={setShowReminderSettings}
            loading={billsLoading}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <BillsList
            bills={bills || []}
            title="All Bills"
            emptyMessage="No bills found. Add your first bill to get started."
            onEdit={handleEditBill}
            onDelete={handleDeleteBill}
            onMarkPaid={setShowPaymentConfirmation}
            onSettings={setShowReminderSettings}
            loading={billsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showBillForm && (
        <BillSetupForm
          bill={editingBill ? {
            ...editingBill,
            accountId: editingBill.account.id,
            categoryId: '', // Will be populated from API
            reminderDays: '1,3,7', // Default value
          } : null}
          open={showBillForm}
          onClose={() => {
            setShowBillForm(false);
            setEditingBill(null);
          }}
          onSuccess={() => {
            refetchBills();
            setShowBillForm(false);
            setEditingBill(null);
          }}
        />
      )}

      {showReminderSettings && (
        <BillReminderSettings
          billId={showReminderSettings}
          open={!!showReminderSettings}
          onClose={() => setShowReminderSettings(null)}
          onSuccess={() => {
            refetchBills();
            setShowReminderSettings(null);
          }}
        />
      )}

      {showPaymentConfirmation && (
        <PaymentConfirmation
          billId={showPaymentConfirmation}
          bill={bills?.find(b => b.id === showPaymentConfirmation) || null}
          open={!!showPaymentConfirmation}
          onClose={() => setShowPaymentConfirmation(null)}
          onSuccess={() => {
            refetchBills();
            setShowPaymentConfirmation(null);
          }}
        />
      )}
    </div>
  );
}

interface BillsListProps {
  bills: Bill[];
  title: string;
  emptyMessage: string;
  onEdit: (bill: Bill) => void;
  onDelete: (billId: string) => void;
  onMarkPaid: (billId: string) => void;
  onSettings: (billId: string) => void;
  loading: boolean;
}

function BillsList({
  bills,
  title,
  emptyMessage,
  onEdit,
  onDelete,
  onMarkPaid,
  onSettings,
  loading
}: BillsListProps) {
  const getBillStatus = (bill: Bill) => {
    const dueDate = new Date(bill.nextDueDate);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    if (bill.status === 'overdue' || isBefore(dueDate, today)) {
      return { variant: 'destructive' as const, label: 'Overdue' };
    }

    if (isBefore(dueDate, threeDaysFromNow)) {
      return { variant: 'secondary' as const, label: 'Due Soon' };
    }

    return { variant: 'outline' as const, label: 'Scheduled' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {bills.length} bill{bills.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {bills.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{bill.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {displayCurrency(bill.amount)} • {bill.frequency} • {bill.account.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Due {formatDistanceToNow(new Date(bill.nextDueDate), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge {...getBillStatus(bill)}>
                {getBillStatus(bill).label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onMarkPaid(bill.id)}>
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(bill)}>
                    Edit Bill
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSettings(bill.id)}>
                    Reminder Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(bill.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
