import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';
import { addDays, isAfter, isBefore, differenceInDays } from 'date-fns';

export interface RecurringPaymentAlert {
  id: string;
  type: 'due_soon' | 'overdue' | 'pattern_detected' | 'payment_confirmed';
  paymentId: string;
  paymentName: string;
  amount: number;
  dueDate: Date;
  daysUntilDue?: number;
  daysOverdue?: number;
  priority: 'low' | 'medium' | 'high';
  message: string;
}

export class RecurringPaymentNotificationService {
  /**
   * Get all pending alerts for a user
   */
  static async getPendingAlerts(userId: string): Promise<RecurringPaymentAlert[]> {
    const alerts: RecurringPaymentAlert[] = [];
    
    // Get upcoming payments (due within 7 days)
    const upcomingPayments = await RecurringPaymentService.getRecurringPayments(userId, {
      status: 'pending',
      limit: 100,
    });

    const today = new Date();
    const weekFromNow = addDays(today, 7);

    for (const payment of upcomingPayments) {
      const dueDate = new Date(payment.nextDueDate);
      
      if (isAfter(dueDate, today) && isBefore(dueDate, weekFromNow)) {
        // Upcoming payment
        const daysUntilDue = differenceInDays(dueDate, today);
        const priority = daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low';
        
        alerts.push({
          id: `due-soon-${payment.id}`,
          type: 'due_soon',
          paymentId: payment.id,
          paymentName: payment.name,
          amount: parseFloat(payment.amount),
          dueDate,
          daysUntilDue,
          priority,
          message: `${payment.name} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
        });
      } else if (isBefore(dueDate, today)) {
        // Overdue payment
        const daysOverdue = differenceInDays(today, dueDate);
        const priority = daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low';
        
        alerts.push({
          id: `overdue-${payment.id}`,
          type: 'overdue',
          paymentId: payment.id,
          paymentName: payment.name,
          amount: parseFloat(payment.amount),
          dueDate,
          daysOverdue,
          priority,
          message: `${payment.name} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
        });
      }
    }

    return alerts;
  }

  /**
   * Send reminders for upcoming payments
   */
  static async sendUpcomingPaymentReminders(userId: string): Promise<void> {
    const alerts = await this.getPendingAlerts(userId);
    const upcomingAlerts = alerts.filter(alert => alert.type === 'due_soon');

    for (const alert of upcomingAlerts) {
      await this.sendNotification(userId, {
        title: `Upcoming Payment: ${alert.paymentName}`,
        message: alert.message,
        type: 'info',
        priority: alert.priority,
        channels: ['inApp', 'email'],
        metadata: {
          paymentId: alert.paymentId,
          paymentName: alert.paymentName,
          amount: alert.amount,
          dueDate: alert.dueDate.toISOString(),
          daysUntilDue: alert.daysUntilDue,
          notificationType: 'recurring_payment_due',
        },
      });
    }
  }

  /**
   * Send alerts for overdue payments
   */
  static async sendOverduePaymentAlerts(userId: string): Promise<void> {
    const alerts = await this.getPendingAlerts(userId);
    const overdueAlerts = alerts.filter(alert => alert.type === 'overdue');

    for (const alert of overdueAlerts) {
      await this.sendNotification(userId, {
        title: `Overdue Payment: ${alert.paymentName}`,
        message: alert.message,
        type: 'warning',
        priority: alert.priority,
        channels: ['inApp', 'email', 'push'],
        metadata: {
          paymentId: alert.paymentId,
          paymentName: alert.paymentName,
          amount: alert.amount,
          dueDate: alert.dueDate.toISOString(),
          daysOverdue: alert.daysOverdue,
          notificationType: 'recurring_payment_missed',
        },
      });
    }
  }

  /**
   * Send notification for detected payment patterns
   */
  static async sendPatternDetectedNotification(
    userId: string,
    patternDetails: {
      merchantName: string;
      amount: number;
      frequency: string;
      confidence: number;
      occurrences: number;
    }
  ): Promise<void> {
    await this.sendNotification(userId, {
      title: 'New Recurring Payment Pattern Detected',
      message: `We detected a potential recurring payment for ${patternDetails.merchantName} (₹${patternDetails.amount}) with ${patternDetails.confidence}% confidence.`,
      type: 'info',
      priority: 'medium',
      channels: ['inApp'],
      metadata: {
        merchantName: patternDetails.merchantName,
        amount: patternDetails.amount,
        frequency: patternDetails.frequency,
        confidence: patternDetails.confidence,
        occurrences: patternDetails.occurrences,
        notificationType: 'pattern_detected',
      },
    });
  }

  /**
   * Send confirmation for processed payments
   */
  static async sendPaymentConfirmation(
    userId: string,
    paymentDetails: {
      paymentId: string;
      paymentName: string;
      amount: number;
      processedDate: Date;
      transactionId: string;
    }
  ): Promise<void> {
    await this.sendNotification(userId, {
      title: `Payment Processed: ${paymentDetails.paymentName}`,
      message: `Your recurring payment of ₹${paymentDetails.amount} has been processed successfully.`,
      type: 'success',
      priority: 'low',
      channels: ['inApp'],
      metadata: {
        paymentId: paymentDetails.paymentId,
        paymentName: paymentDetails.paymentName,
        amount: paymentDetails.amount,
        processedDate: paymentDetails.processedDate.toISOString(),
        transactionId: paymentDetails.transactionId,
        notificationType: 'recurring_payment_confirmed',
      },
    });
  }

  /**
   * Send notification through the notification system
   */
  private static async sendNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'error' | 'success';
      priority: 'low' | 'medium' | 'high';
      channels: ('email' | 'push' | 'inApp')[];
      metadata: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...notification,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send notification:', await response.text());
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Process all recurring payment notifications for a user
   */
  static async processUserNotifications(userId: string): Promise<{
    upcomingReminders: number;
    overdueAlerts: number;
    totalAlerts: number;
  }> {
    const alerts = await this.getPendingAlerts(userId);
    
    await this.sendUpcomingPaymentReminders(userId);
    await this.sendOverduePaymentAlerts(userId);

    return {
      upcomingReminders: alerts.filter(a => a.type === 'due_soon').length,
      overdueAlerts: alerts.filter(a => a.type === 'overdue').length,
      totalAlerts: alerts.length,
    };
  }
}
