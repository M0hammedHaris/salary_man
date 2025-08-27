import { type RecurringPayment, type Account } from '../db/schema';
import { type BillReminder } from './bill-service';

export interface BillNotificationChannels {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms?: boolean; // Future implementation
}

export interface BillNotificationConfig {
  userId: string;
  billId: string;
  channels: BillNotificationChannels;
  escalationRules?: {
    daysBeforeDue: number[];
    increaseUrgency: boolean;
  };
}

export interface BillNotificationData {
  type: 'bill_reminder' | 'insufficient_funds' | 'payment_confirmation' | 'overdue_bill';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  bill: RecurringPayment;
  account: Account;
  daysUntilDue: number;
  channels: ('email' | 'push' | 'inApp')[];
  metadata?: Record<string, unknown>;
}

/**
 * Bill Notification Service for managing bill reminder notifications
 * Integrates with existing notification infrastructure
 */
export class BillNotificationService {
  
  /**
   * Send bill reminder notification across configured channels
   */
  static async sendBillReminderNotification(
    reminder: BillReminder,
    channels: BillNotificationChannels = { email: true, push: true, inApp: true }
  ): Promise<void> {
    const notificationData = this.createBillNotificationData(reminder, channels);
    
    try {
      // Send in-app notification
      if (channels.inApp) {
        await this.sendInAppNotification(notificationData);
      }

      // Send email notification
      if (channels.email) {
        await this.sendEmailNotification(notificationData);
      }

      // Send push notification
      if (channels.push) {
        await this.sendPushNotification(notificationData);
      }

      console.log('Bill reminder notification sent successfully:', {
        billId: reminder.bill.id,
        billName: reminder.bill.name,
        daysUntilDue: reminder.daysUntilDue,
        channels: Object.entries(channels).filter(([, enabled]) => enabled).map(([channel]) => channel),
      });

    } catch (error) {
      console.error('Failed to send bill reminder notification:', error);
      throw error;
    }
  }

  /**
   * Send insufficient funds warning notification
   */
  static async sendInsufficientFundsNotification(
    userId: string,
    bill: RecurringPayment,
    account: Account,
    shortfall: string,
    channels: BillNotificationChannels = { email: true, push: true, inApp: true }
  ): Promise<void> {
    const notificationData: BillNotificationData = {
      type: 'insufficient_funds',
      urgency: 'high',
      title: 'Insufficient Funds Warning',
      message: `Insufficient funds in ${account.name} for upcoming ${bill.name} payment. You need ₹${shortfall} more.`,
      bill,
      account,
      daysUntilDue: 0,
      channels: Object.entries(channels).filter(([, enabled]) => enabled).map(([channel]) => channel) as ('email' | 'push' | 'inApp')[],
      metadata: {
        shortfall,
        warningType: 'insufficient_funds',
      },
    };

    try {
      if (channels.inApp) {
        await this.sendInAppNotification(notificationData);
      }

      if (channels.email) {
        await this.sendEmailNotification(notificationData);
      }

      if (channels.push) {
        await this.sendPushNotification(notificationData);
      }

    } catch (error) {
      console.error('Failed to send insufficient funds notification:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation notification
   */
  static async sendPaymentConfirmationNotification(
    userId: string,
    bill: RecurringPayment,
    account: Account,
    paymentAmount: string,
    channels: BillNotificationChannels = { email: true, push: false, inApp: true }
  ): Promise<void> {
    const notificationData: BillNotificationData = {
      type: 'payment_confirmation',
      urgency: 'low',
      title: 'Payment Confirmed',
      message: `Payment of ₹${paymentAmount} for ${bill.name} has been confirmed.`,
      bill,
      account,
      daysUntilDue: 0,
      channels: Object.entries(channels).filter(([, enabled]) => enabled).map(([channel]) => channel) as ('email' | 'push' | 'inApp')[],
      metadata: {
        paymentAmount,
        confirmationType: 'payment_confirmation',
      },
    };

    try {
      if (channels.inApp) {
        await this.sendInAppNotification(notificationData);
      }

      if (channels.email) {
        await this.sendEmailNotification(notificationData);
      }

      if (channels.push) {
        await this.sendPushNotification(notificationData);
      }

    } catch (error) {
      console.error('Failed to send payment confirmation notification:', error);
      throw error;
    }
  }

  /**
   * Create notification data from bill reminder
   */
  private static createBillNotificationData(
    reminder: BillReminder,
    channels: BillNotificationChannels
  ): BillNotificationData {
    const urgency = this.determineUrgency(reminder.daysUntilDue, reminder.isOverdue);
    const title = this.generateTitle(reminder);
    
    return {
      type: 'bill_reminder',
      urgency,
      title,
      message: reminder.message,
      bill: reminder.bill,
      account: reminder.account,
      daysUntilDue: reminder.daysUntilDue,
      channels: Object.entries(channels).filter(([, enabled]) => enabled).map(([channel]) => channel) as ('email' | 'push' | 'inApp')[],
      metadata: {
        reminderType: reminder.reminderType,
        isOverdue: reminder.isOverdue,
      },
    };
  }

  /**
   * Determine notification urgency based on days until due
   */
  private static determineUrgency(daysUntilDue: number, isOverdue: boolean): 'low' | 'medium' | 'high' | 'urgent' {
    if (isOverdue) return 'urgent';
    if (daysUntilDue === 0) return 'urgent'; // Due today
    if (daysUntilDue === 1) return 'high'; // Due tomorrow
    if (daysUntilDue <= 3) return 'medium'; // Due in 2-3 days
    return 'low'; // Due in 4+ days
  }

  /**
   * Generate notification title based on reminder timing
   */
  private static generateTitle(reminder: BillReminder): string {
    if (reminder.isOverdue) {
      return `Overdue Bill: ${reminder.bill.name}`;
    }
    
    if (reminder.daysUntilDue === 0) {
      return `Bill Due Today: ${reminder.bill.name}`;
    }
    
    if (reminder.daysUntilDue === 1) {
      return `Bill Due Tomorrow: ${reminder.bill.name}`;
    }
    
    return `Bill Reminder: ${reminder.bill.name}`;
  }

  /**
   * Send in-app notification using existing notification provider
   */
  private static async sendInAppNotification(data: BillNotificationData): Promise<void> {
    // This would typically trigger the notification provider's sendNotification method
    // For now, we'll simulate it by calling the notification API directly
    const response = await fetch('/api/notifications/in-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        message: data.message,
        type: data.urgency === 'urgent' ? 'error' : data.urgency === 'high' ? 'warning' : data.urgency === 'medium' ? 'warning' : 'info',
        billId: data.bill.id,
        billName: data.bill.name,
        dueDate: data.bill.nextDueDate.toISOString(),
        amount: data.bill.amount,
        daysUntilDue: data.daysUntilDue,
        notificationType: data.type,
        priority: data.urgency,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send in-app notification: ${response.statusText}`);
    }
  }

  /**
   * Send email notification using bill reminder email endpoint
   */
  private static async sendEmailNotification(data: BillNotificationData): Promise<void> {
    const response = await fetch('/api/notifications/bill-reminder-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        message: data.message,
        type: data.urgency === 'urgent' ? 'error' : data.urgency === 'high' ? 'warning' : data.urgency === 'medium' ? 'warning' : 'info',
        billId: data.bill.id,
        billName: data.bill.name,
        dueDate: data.bill.nextDueDate.toISOString(),
        amount: data.bill.amount,
        daysUntilDue: data.daysUntilDue,
        accountName: data.account.name,
        notificationType: data.type,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email notification: ${response.statusText}`);
    }
  }

  /**
   * Send push notification using bill reminder push endpoint
   */
  private static async sendPushNotification(data: BillNotificationData): Promise<void> {
    const response = await fetch('/api/notifications/bill-reminder-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        message: data.message,
        type: data.urgency === 'urgent' ? 'error' : data.urgency === 'high' ? 'warning' : data.urgency === 'medium' ? 'warning' : 'info',
        icon: '/icons/bill-notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: `bill-reminder-${data.bill.id}`,
        data: {
          url: '/bills',
          billId: data.bill.id,
          billName: data.bill.name,
          dueDate: data.bill.nextDueDate.toISOString(),
          accountName: data.account.name,
          notificationType: data.type,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send push notification: ${response.statusText}`);
    }
  }

  /**
   * Get notification preferences for a user and bill
   * This would typically query the database for user preferences
   */
  static async getBillNotificationPreferences(
    _userId: string,
    _billId: string
  ): Promise<BillNotificationChannels> {
    // TODO: Implement database query for user's bill notification preferences
    // For now, return default preferences
    return {
      email: true,
      push: true,
      inApp: true,
      sms: false,
    };
  }

  /**
   * Update notification preferences for a user and bill
   */
  static async updateBillNotificationPreferences(
    userId: string,
    billId: string,
    channels: BillNotificationChannels
  ): Promise<void> {
    // TODO: Implement database update for user's bill notification preferences
    console.log('Updating bill notification preferences:', {
      userId,
      billId,
      channels,
    });
  }
}
