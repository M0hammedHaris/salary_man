import { db } from '@/lib/db';
import { alerts, notificationPreferences, accounts } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Alert, NotificationPreferences } from '@/lib/db/schema';

export interface NotificationFilters {
  status?: 'triggered' | 'acknowledged' | 'dismissed' | 'snoozed' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  alertType?: string;
  includeArchived?: boolean;
  search?: string;
  accountId?: string;
}

export interface NotificationSortOptions {
  sortBy?: 'triggeredAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface NotificationCenterData {
  notifications: (Alert & { accountName?: string; accountType?: string })[];
  summary: {
    unread: number;
    high: number;
    medium: number;
    low: number;
    archived: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface NotificationGrouping {
  groupId: string;
  groupType: 'type' | 'account' | 'priority' | 'timeframe';
  title: string;
  count: number;
  notifications: Alert[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary?: string;
}

export interface SmartGroupingOptions {
  maxGroupSize?: number;
  groupByType?: boolean;
  groupByAccount?: boolean;
  groupByTimeframe?: boolean;
  timeframeHours?: number;
  preventOverload?: boolean;
  maxNotificationsPerDay?: number;
}

/**
 * Notification Center Service for centralized notification management
 * Provides smart grouping, filtering, and prioritization
 */
export class NotificationCenterService {
  /**
   * Get notifications with filtering, pagination, and account information
   */
  static async getNotifications(
    userId: string,
    filters: NotificationFilters = {},
    sortOptions: NotificationSortOptions = {},
    paginationOptions: PaginationOptions = {}
  ): Promise<NotificationCenterData> {
    const {
      status = 'all',
      priority = 'all',
      alertType,
      includeArchived = false,
      search,
      accountId,
    } = filters;

    const { sortBy = 'triggeredAt', sortOrder = 'desc' } = sortOptions;
    const { page = 1, limit = 20 } = paginationOptions;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(alerts.userId, userId)];

    if (status !== 'all') {
      whereConditions.push(eq(alerts.status, status));
    }

    if (priority !== 'all') {
      whereConditions.push(eq(alerts.priority, priority));
    }

    if (alertType) {
      whereConditions.push(sql`${alerts.alertType} = ${alertType}`);
    }

    if (accountId) {
      whereConditions.push(eq(alerts.accountId, accountId));
    }

    if (!includeArchived) {
      whereConditions.push(sql`${alerts.archivedAt} IS NULL`);
    }

    if (search) {
      whereConditions.push(
        sql`(${alerts.message} ILIKE ${'%' + search + '%'} OR ${accounts.name} ILIKE ${'%' + search + '%'})`
      );
    }

    // Build order by clause
    let orderByClause;
    const orderDirection = sortOrder === 'asc' ? sql`ASC` : sql`DESC`;

    switch (sortBy) {
      case 'priority':
        orderByClause = sql`
          CASE ${alerts.priority}
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END ${orderDirection}
        `;
        break;
      case 'status':
        orderByClause = sql`${alerts.status} ${orderDirection}`;
        break;
      default:
        orderByClause = sql`${alerts.triggeredAt} ${orderDirection}`;
    }

    // Get notifications with account information
    const notificationsQuery = db
      .select({
        // Alert fields
        id: alerts.id,
        userId: alerts.userId,
        accountId: alerts.accountId,
        alertType: alerts.alertType,
        message: alerts.message,
        currentValue: alerts.currentValue,
        thresholdValue: alerts.thresholdValue,
        status: alerts.status,
        triggeredAt: alerts.triggeredAt,
        acknowledgedAt: alerts.acknowledgedAt,
        snoozeUntil: alerts.snoozeUntil,
        deliveryChannels: alerts.deliveryChannels,
        deliveredAt: alerts.deliveredAt,
        deliveryStatus: alerts.deliveryStatus,
        priority: alerts.priority,
        archivedAt: alerts.archivedAt,
        readAt: alerts.readAt,
        createdAt: alerts.createdAt,
        updatedAt: alerts.updatedAt,
        // Account fields
        accountName: accounts.name,
        accountType: accounts.type,
      })
      .from(alerts)
      .leftJoin(accounts, eq(alerts.accountId, accounts.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const notifications = await notificationsQuery;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .leftJoin(accounts, eq(alerts.accountId, accounts.id))
      .where(and(...whereConditions));

    const [{ count: totalCount }] = await countQuery;

    // Get summary statistics
    const summary = await this.getNotificationSummary(userId);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications: notifications.map(notification => ({
        ...notification,
        accountName: notification.accountName ?? undefined,
        accountType: notification.accountType ?? undefined,
      })),
      summary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get notification summary statistics
   */
  static async getNotificationSummary(userId: string) {
    const summaryQuery = db
      .select({
        total: sql<number>`count(*)`,
        unread: sql<number>`count(*) filter (where ${alerts.status} = 'triggered')`,
        high: sql<number>`count(*) filter (where ${alerts.priority} IN ('high', 'critical'))`,
        medium: sql<number>`count(*) filter (where ${alerts.priority} = 'medium')`,
        low: sql<number>`count(*) filter (where ${alerts.priority} = 'low')`,
        archived: sql<number>`count(*) filter (where ${alerts.archivedAt} IS NOT NULL)`,
      })
      .from(alerts)
      .where(eq(alerts.userId, userId));

    const [summary] = await summaryQuery;

    return {
      total: summary.total,
      unread: summary.unread,
      high: summary.high,
      medium: summary.medium,
      low: summary.low,
      archived: summary.archived,
    };
  }

  /**
   * Smart notification grouping to prevent overload
   */
  static async groupNotifications(
    userId: string,
    options: SmartGroupingOptions = {}
  ): Promise<NotificationGrouping[]> {
    const {
      groupByType = true,
      groupByAccount = true,
      groupByTimeframe = true,
      timeframeHours = 24,
      preventOverload = true,
      maxNotificationsPerDay = 50,
    } = options;

    // Get recent notifications for grouping
    const timeframeCutoff = new Date();
    timeframeCutoff.setHours(timeframeCutoff.getHours() - timeframeHours);

    const notifications = await db
      .select()
      .from(alerts)
      .leftJoin(accounts, eq(alerts.accountId, accounts.id))
      .where(and(
        eq(alerts.userId, userId),
        eq(alerts.status, 'triggered'),
        sql`${alerts.triggeredAt} >= ${timeframeCutoff}`,
        sql`${alerts.archivedAt} IS NULL`
      ))
      .orderBy(desc(alerts.triggeredAt));

    const groups: NotificationGrouping[] = [];

    // Check for overload prevention
    if (preventOverload && notifications.length > maxNotificationsPerDay) {
      const overloadGroup: NotificationGrouping = {
        groupId: 'overload-summary',
        groupType: 'timeframe',
        title: 'High Activity Summary',
        count: notifications.length,
        notifications: notifications.slice(0, 5).map(n => n.alerts),
        priority: 'high',
        summary: `You have ${notifications.length} notifications. Latest 5 shown to prevent overload.`,
      };
      return [overloadGroup];
    }

    // Group by alert type
    if (groupByType) {
      const typeGroups = this.groupNotificationsByType(notifications.map(n => n.alerts));
      groups.push(...typeGroups);
    }

    // Group by account
    if (groupByAccount) {
      const accountGroups = this.groupNotificationsByAccount(
        notifications.map(n => ({ ...n.alerts, accountName: n.accounts?.name }))
      );
      groups.push(...accountGroups);
    }

    // Group by timeframe
    if (groupByTimeframe) {
      const timeGroups = this.groupNotificationsByTimeframe(notifications.map(n => n.alerts));
      groups.push(...timeGroups);
    }

    // Sort groups by priority and count
    return groups
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return b.count - a.count;
      })
      .slice(0, 10); // Limit to top 10 groups
  }

  /**
   * Group notifications by alert type
   */
  private static groupNotificationsByType(notifications: Alert[]): NotificationGrouping[] {
    const typeMap = new Map<string, Alert[]>();
    
    notifications.forEach(notification => {
      const type = notification.alertType;
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type)!.push(notification);
    });

    return Array.from(typeMap.entries()).map(([type, notifs]) => ({
      groupId: `type-${type}`,
      groupType: 'type' as const,
      title: this.getAlertTypeDisplayName(type),
      count: notifs.length,
      notifications: notifs,
      priority: this.getHighestPriority(notifs),
    }));
  }

  /**
   * Group notifications by account
   */
  private static groupNotificationsByAccount(
    notifications: (Alert & { accountName?: string })[]
  ): NotificationGrouping[] {
    const accountMap = new Map<string, Alert[]>();
    
    notifications.forEach(notification => {
      const accountKey = notification.accountName || 'Unknown Account';
      if (!accountMap.has(accountKey)) {
        accountMap.set(accountKey, []);
      }
      accountMap.get(accountKey)!.push(notification);
    });

    return Array.from(accountMap.entries()).map(([accountName, notifs]) => ({
      groupId: `account-${accountName}`,
      groupType: 'account' as const,
      title: `${accountName} Alerts`,
      count: notifs.length,
      notifications: notifs,
      priority: this.getHighestPriority(notifs),
    }));
  }

  /**
   * Group notifications by timeframe
   */
  private static groupNotificationsByTimeframe(notifications: Alert[]): NotificationGrouping[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent = notifications.filter(n => n.triggeredAt >= oneDayAgo);
    const thisWeek = notifications.filter(n => n.triggeredAt >= oneWeekAgo && n.triggeredAt < oneDayAgo);
    const older = notifications.filter(n => n.triggeredAt < oneWeekAgo);

    const groups: NotificationGrouping[] = [];

    if (recent.length > 0) {
      groups.push({
        groupId: 'timeframe-recent',
        groupType: 'timeframe',
        title: 'Recent (Last 24 hours)',
        count: recent.length,
        notifications: recent,
        priority: this.getHighestPriority(recent),
      });
    }

    if (thisWeek.length > 0) {
      groups.push({
        groupId: 'timeframe-week',
        groupType: 'timeframe',
        title: 'This Week',
        count: thisWeek.length,
        notifications: thisWeek,
        priority: this.getHighestPriority(thisWeek),
      });
    }

    if (older.length > 0) {
      groups.push({
        groupId: 'timeframe-older',
        groupType: 'timeframe',
        title: 'Older',
        count: older.length,
        notifications: older,
        priority: this.getHighestPriority(older),
      });
    }

    return groups;
  }

  /**
   * Get highest priority from a list of notifications
   */
  private static getHighestPriority(notifications: Alert[]): 'low' | 'medium' | 'high' | 'critical' {
    const priorities = notifications.map(n => n.priority || 'medium');
    
    if (priorities.includes('critical')) return 'critical';
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Get display name for alert type
   */
  private static getAlertTypeDisplayName(alertType: string): string {
    const displayNames: Record<string, string> = {
      credit_utilization: 'Credit Usage Alerts',
      low_balance: 'Low Balance Alerts',
      bill_reminder_1_day: 'Bill Reminders (1 Day)',
      bill_reminder_3_day: 'Bill Reminders (3 Days)',
      bill_reminder_7_day: 'Bill Reminders (Week)',
      bill_reminder_overdue: 'Overdue Bills',
      insufficient_funds_bill: 'Insufficient Funds',
      spending_limit: 'Spending Limit Alerts',
      unusual_activity: 'Unusual Activity',
    };
    
    return displayNames[alertType] || alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Update notification status with smart handling
   */
  static async updateNotificationStatus(
    userId: string,
    notificationId: string,
    action: 'markAsRead' | 'markAsUnread' | 'archive' | 'unarchive' | 'acknowledge' | 'dismiss' | 'snooze',
    options: { snoozeHours?: number } = {}
  ): Promise<Alert | null> {
    // Verify notification belongs to user
    const notification = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.id, notificationId), eq(alerts.userId, userId)))
      .limit(1);

    if (notification.length === 0) {
      throw new Error('Notification not found or access denied');
    }

    const updateData: Record<string, Date | string | null> = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'markAsRead':
        updateData.readAt = new Date();
        break;
      case 'markAsUnread':
        updateData.readAt = null;
        break;
      case 'archive':
        updateData.archivedAt = new Date();
        break;
      case 'unarchive':
        updateData.archivedAt = null;
        break;
      case 'acknowledge':
        updateData.status = 'acknowledged';
        updateData.acknowledgedAt = new Date();
        break;
      case 'dismiss':
        updateData.status = 'dismissed';
        break;
      case 'snooze':
        updateData.status = 'snoozed';
        const snoozeHours = options.snoozeHours || 24;
        updateData.snoozeUntil = new Date(Date.now() + snoozeHours * 60 * 60 * 1000);
        break;
    }

    const [updatedNotification] = await db
      .update(alerts)
      .set(updateData)
      .where(and(eq(alerts.id, notificationId), eq(alerts.userId, userId)))
      .returning();

    return updatedNotification;
  }

  /**
   * Get user notification preferences with defaults
   */
  static async getUserNotificationPreferences(
    userId: string,
    alertType?: string
  ): Promise<NotificationPreferences[]> {
    let query = db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    if (alertType) {
      query = db
        .select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.alertType, alertType)
        ));
    }

    return await query;
  }

  /**
   * Check if notification should be sent based on preferences and quiet hours
   */
  static async shouldSendNotification(
    userId: string,
    alertType: string,
    channel: 'email' | 'push' | 'inApp' | 'sms',
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<boolean> {
    const preferences = await this.getUserNotificationPreferences(userId, alertType);
    
    // If no preferences set, use defaults
    if (preferences.length === 0) {
      const defaultChannels = { email: true, push: true, inApp: true, sms: false };
      return defaultChannels[channel] || false;
    }

    const preference = preferences[0];

    // Check if channel is enabled
    const channelEnabled = {
      email: preference.emailEnabled,
      push: preference.pushEnabled,
      inApp: preference.inAppEnabled,
      sms: preference.smsEnabled,
    };

    if (!channelEnabled[channel]) {
      return false;
    }

    // Check emergency override for critical alerts
    if (urgency === 'critical' && preference.emergencyOverride) {
      return true;
    }

    // Check quiet hours
    if (preference.quietHoursStart && preference.quietHoursEnd) {
      const now = new Date();
      const timezone = preference.timezone || 'UTC';
      
      // Convert current time to user's timezone
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }).format(now);

      const currentTime = userTime.replace(':', '');
      const quietStart = preference.quietHoursStart.replace(':', '');
      const quietEnd = preference.quietHoursEnd.replace(':', '');

      // Check if current time is within quiet hours
      if (quietStart <= quietEnd) {
        // Same day quiet hours
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return urgency === 'critical' && (preference.emergencyOverride ?? false);
        }
      } else {
        // Overnight quiet hours
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return urgency === 'critical' && (preference.emergencyOverride ?? false);
        }
      }
    }

    return true;
  }
}
