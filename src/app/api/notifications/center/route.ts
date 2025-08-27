import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { alerts, accounts } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const notificationCenterQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  status: z.enum(['triggered', 'acknowledged', 'dismissed', 'snoozed', 'all']).default('all'),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'all']).default('all'),
  alertType: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['triggeredAt', 'priority', 'status']).default('triggeredAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeArchived: z.string().transform(val => val === 'true'),
}).transform(data => ({
  ...data,
  page: data.page || 1,
  limit: data.limit || 20,
  includeArchived: data.includeArchived ?? false,
}));

// GET /api/notifications/center - Get all user notifications with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = notificationCenterQuerySchema.parse(query);

    const {
      page,
      limit,
      status,
      priority,
      alertType,
      search,
      sortBy,
      sortOrder,
      includeArchived
    } = validatedQuery;

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(alerts.userId, userId)];

    // Filter by status
    if (status !== 'all') {
      whereConditions.push(eq(alerts.status, status));
    }

    // Filter by priority
    if (priority !== 'all') {
      whereConditions.push(eq(alerts.priority, priority));
    }

    // Filter by alert type
    if (alertType) {
      whereConditions.push(sql`${alerts.alertType} = ${alertType}`);
    }

    // Filter archived/unarchived
    if (!includeArchived) {
      whereConditions.push(sql`${alerts.archivedAt} IS NULL`);
    }

    // Search functionality
    if (search) {
      const searchCondition = or(
        like(alerts.message, `%${search}%`),
        like(accounts.name, `%${search}%`)
      );
      
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Build order by clause
    let orderByClause;
    const orderDirection = sortOrder === 'asc' ? asc : desc;
    
    switch (sortBy) {
      case 'priority':
        // Custom priority ordering: critical > high > medium > low
        orderByClause = sql`
          CASE ${alerts.priority}
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END ${sql.raw(sortOrder === 'asc' ? 'ASC' : 'DESC')}
        `;
        break;
      case 'status':
        orderByClause = orderDirection(alerts.status);
        break;
      default:
        orderByClause = orderDirection(alerts.triggeredAt);
    }

    // Execute main query with joins
    const notificationsQuery = db
      .select({
        id: alerts.id,
        accountId: alerts.accountId,
        alertType: alerts.alertType,
        message: alerts.message,
        currentValue: alerts.currentValue,
        thresholdValue: alerts.thresholdValue,
        status: alerts.status,
        priority: alerts.priority,
        triggeredAt: alerts.triggeredAt,
        acknowledgedAt: alerts.acknowledgedAt,
        snoozeUntil: alerts.snoozeUntil,
        deliveryChannels: alerts.deliveryChannels,
        deliveredAt: alerts.deliveredAt,
        deliveryStatus: alerts.deliveryStatus,
        readAt: alerts.readAt,
        archivedAt: alerts.archivedAt,
        createdAt: alerts.createdAt,
        updatedAt: alerts.updatedAt,
        // Account info
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

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .leftJoin(accounts, eq(alerts.accountId, accounts.id))
      .where(and(...whereConditions));

    const [{ count: totalCount }] = await countQuery;

    // Get summary statistics
    const summaryQuery = db
      .select({
        totalUnread: sql<number>`count(*) filter (where ${alerts.status} = 'triggered')`,
        totalHigh: sql<number>`count(*) filter (where ${alerts.priority} IN ('high', 'critical'))`,
        totalMedium: sql<number>`count(*) filter (where ${alerts.priority} = 'medium')`,
        totalLow: sql<number>`count(*) filter (where ${alerts.priority} = 'low')`,
        totalArchived: sql<number>`count(*) filter (where ${alerts.archivedAt} IS NOT NULL)`,
      })
      .from(alerts)
      .where(eq(alerts.userId, userId));

    const [summary] = await summaryQuery;

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        summary: {
          unread: summary.totalUnread,
          high: summary.totalHigh,
          medium: summary.totalMedium,
          low: summary.totalLow,
          archived: summary.totalArchived,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/center - Update notification status (mark as read, archive, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId || !action) {
      return NextResponse.json(
        { error: 'Missing notificationId or action' },
        { status: 400 }
      );
    }

    // Verify notification belongs to user
    const notification = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.id, notificationId), eq(alerts.userId, userId)))
      .limit(1);

    if (notification.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const updateData: Partial<typeof alerts.$inferInsert> = { updatedAt: new Date() };

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
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const [updatedNotification] = await db
      .update(alerts)
      .set(updateData)
      .where(and(eq(alerts.id, notificationId), eq(alerts.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: `Notification ${action} successfully`,
    });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
