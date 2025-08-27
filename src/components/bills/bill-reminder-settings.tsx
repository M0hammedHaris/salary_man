'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Bell, Mail, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Bill {
  id: string;
  name: string;
  amount: string;
  reminderDays: string;
}

const reminderSettingsSchema = z.object({
  reminderDays: z.string().min(1, 'At least one reminder day is required'),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

type ReminderSettingsData = z.infer<typeof reminderSettingsSchema>;

interface BillReminderSettingsProps {
  billId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BillReminderSettings({ billId, open, onClose, onSuccess }: BillReminderSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loadingBill, setLoadingBill] = useState(true);

  const form = useForm<ReminderSettingsData>({
    resolver: zodResolver(reminderSettingsSchema),
    defaultValues: {
      reminderDays: '1,3,7',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
  });

  // Load bill data
  useEffect(() => {
    const loadBill = async () => {
      if (!billId || !open) return;

      try {
        setLoadingBill(true);
        const response = await fetch(`/api/bills/${billId}`);
        if (!response.ok) throw new Error('Failed to load bill');
        
        const billData = await response.json();
        setBill(billData);

        // Set form values from bill data
        form.reset({
          reminderDays: billData.reminderDays || '1,3,7',
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
        });
      } catch (error) {
        console.error('Error loading bill:', error);
      } finally {
        setLoadingBill(false);
      }
    };

    loadBill();
  }, [billId, open, form]);

  const onSubmit = async (data: ReminderSettingsData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderDays: data.reminderDays,
          // Note: Notification preferences would typically be stored separately
          // This is a simplified implementation
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update reminder settings');
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      // You might want to show a toast or error message here
    } finally {
      setIsLoading(false);
    }
  };

  const parseReminderDays = (reminderDaysStr: string): number[] => {
    return reminderDaysStr
      .split(',')
      .map(day => parseInt(day.trim(), 10))
      .filter(day => !isNaN(day) && day > 0)
      .sort((a, b) => a - b);
  };

  const formatReminderDays = (days: number[]): string => {
    return days.map(day => {
      if (day === 1) return '1 day';
      if (day === 7) return '1 week';
      if (day === 14) return '2 weeks';
      return `${day} days`;
    }).join(', ');
  };

  const currentReminderDays = parseReminderDays(form.watch('reminderDays'));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reminder Settings</DialogTitle>
          {bill && (
            <p className="text-sm text-muted-foreground">
              Configure reminders for {bill.name}
            </p>
          )}
        </DialogHeader>

        {loadingBill ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Bill Info */}
            {bill && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{bill.name}</CardTitle>
                  <CardDescription>
                    Amount: ₹{Number(bill.amount).toFixed(2)}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Reminder Days */}
            <div className="space-y-3">
              <Label htmlFor="reminderDays">Reminder Schedule</Label>
              <Input
                id="reminderDays"
                placeholder="1,3,7,14"
                {...form.register('reminderDays')}
              />
              <p className="text-xs text-muted-foreground">
                Days before due date to send reminders (comma-separated numbers)
              </p>
              
              {/* Preview of reminder schedule */}
              {currentReminderDays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reminder Schedule:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentReminderDays.map((day) => (
                      <Badge key={day} variant="outline">
                        {day === 1 ? '1 day before' : 
                         day === 7 ? '1 week before' : 
                         day === 14 ? '2 weeks before' : 
                         `${day} days before`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {form.formState.errors.reminderDays && (
                <p className="text-sm text-destructive">{form.formState.errors.reminderDays.message}</p>
              )}
            </div>

            {/* Notification Channels */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Notification Channels</Label>
              
              <div className="space-y-3">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.watch('emailNotifications')}
                    onCheckedChange={(checked) => form.setValue('emailNotifications', checked)}
                  />
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive in-app push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.watch('pushNotifications')}
                    onCheckedChange={(checked) => form.setValue('pushNotifications', checked)}
                  />
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders via text message
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.watch('smsNotifications')}
                    onCheckedChange={(checked) => form.setValue('smsNotifications', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Reminder Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reminder Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">📅 Payment Reminder</p>
                  <p>Your {bill?.name || 'bill'} payment of ₹{bill ? Number(bill.amount).toFixed(2) : '0.00'} is due in 3 days.</p>
                  <p className="text-muted-foreground">
                    You&apos;ll receive similar reminders {formatReminderDays(currentReminderDays)} before the due date.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
