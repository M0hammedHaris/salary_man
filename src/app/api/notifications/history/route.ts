import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notificationHistory, alerts } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, between } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const historyQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 200)),
  channel: z.enum(['email', 'push', 'inApp', 'sms', 'all']).default('all'),
  status: z.enum(['sent', 'delivered', 'failed', 'read', 'all']).default('all'),
  notificationType: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['sentAt', 'deliveredAt', 'readAt']).default('sentAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).transform(data => ({
  ...data,
  page: data.page || 1,
  limit: data.limit || 50,
}));

// GET /api/notifications/history - Get notification history with search and filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = historyQuerySchema.parse(query);

    const {
      page,
      limit,
      channel,
      status,
      notificationType,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = validatedQuery;

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(notificationHistory.userId, userId)];

    // Filter by channel
    if (channel !== 'all') {
      whereConditions.push(eq(notificationHistory.channel, channel));
    }

    // Filter by status
    if (status !== 'all') {
      whereConditions.push(eq(notificationHistory.status, status));
    }

    // Filter by notification type
    if (notificationType) {
      whereConditions.push(eq(notificationHistory.notificationType, notificationType));
    }

    // Date range filtering
    if (startDate && endDate) {
      whereConditions.push(
        between(notificationHistory.sentAt, new Date(startDate), new Date(endDate))
      );
    } else if (startDate) {
      whereConditions.push(sql`${notificationHistory.sentAt} >= ${new Date(startDate)}`);
    } else if (endDate) {
      whereConditions.push(sql`${notificationHistory.sentAt} <= ${new Date(endDate)}`);
    }

    // Search functionality
    if (search) {
      whereConditions.push(
        sql`(${notificationHistory.title} ILIKE ${'%' + search + '%'} OR ${notificationHistory.message} ILIKE ${'%' + search + '%'})`
      );
    }

    // Build order by clause
    let orderByClause;
    const orderDirection = sortOrder === 'asc' ? asc : desc;
    
    switch (sortBy) {
      case 'deliveredAt':
        orderByClause = orderDirection(notificationHistory.deliveredAt);
        break;
      case 'readAt':
        orderByClause = orderDirection(notificationHistory.readAt);
        break;
      default:
        orderByClause = orderDirection(notificationHistory.sentAt);
    }

    // Execute main query
    const historyQuery = db
      .select({
        id: notificationHistory.id,
        alertId: notificationHistory.alertId,
        notificationType: notificationHistory.notificationType,
        channel: notificationHistory.channel,
        title: notificationHistory.title,
        message: notificationHistory.message,
        status: notificationHistory.status,
        sentAt: notificationHistory.sentAt,
        deliveredAt: notificationHistory.deliveredAt,
        readAt: notificationHistory.readAt,
        metadata: notificationHistory.metadata,
        createdAt: notificationHistory.createdAt,
      })
      .from(notificationHistory)
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const history = await historyQuery;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(notificationHistory)
      .where(and(...whereConditions));

    const [{ count: totalCount }] = await countQuery;

    // Get summary statistics
    const summaryQuery = db
      .select({
        totalSent: sql<number>`count(*)`,
        totalEmail: sql<number>`count(*) filter (where ${notificationHistory.channel} = 'email')`,
        totalPush: sql<number>`count(*) filter (where ${notificationHistory.channel} = 'push')`,
        totalInApp: sql<number>`count(*) filter (where ${notificationHistory.channel} = 'inApp')`,
        totalSms: sql<number>`count(*) filter (where ${notificationHistory.channel} = 'sms')`,
        totalDelivered: sql<number>`count(*) filter (where ${notificationHistory.status} = 'delivered')`,
        totalFailed: sql<number>`count(*) filter (where ${notificationHistory.status} = 'failed')`,
        totalRead: sql<number>`count(*) filter (where ${notificationHistory.status} = 'read')`,
      })
      .from(notificationHistory)
      .where(eq(notificationHistory.userId, userId));

    const [summary] = await summaryQuery;

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        summary: {
          sent: summary.totalSent,
          email: summary.totalEmail,
          push: summary.totalPush,
          inApp: summary.totalInApp,
          sms: summary.totalSms,
          delivered: summary.totalDelivered,
          failed: summary.totalFailed,
          read: summary.totalRead,
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

    console.error('Failed to fetch notification history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification history' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/history - Record new notification history entry
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const historyEntrySchema = z.object({
      alertId: z.string().uuid().optional(),
      notificationType: z.string().min(1),
      channel: z.enum(['email', 'push', 'inApp', 'sms']),
      title: z.string().min(1),
      message: z.string().min(1),
      status: z.enum(['sent', 'delivered', 'failed', 'read']).default('sent'),
      deliveredAt: z.string().datetime().optional(),
      readAt: z.string().datetime().optional(),
      metadata: z.record(z.string(), z.unknown()).optional().default({}),
    });

    const validatedData = historyEntrySchema.parse(body);

    // If alertId is provided, verify it belongs to the user
    if (validatedData.alertId) {
      const alertExists = await db
        .select({ id: alerts.id })
        .from(alerts)
        .where(and(
          eq(alerts.id, validatedData.alertId),
          eq(alerts.userId, userId)
        ))
        .limit(1);

      if (alertExists.length === 0) {
        return NextResponse.json(
          { error: 'Alert not found or does not belong to user' },
          { status: 404 }
        );
      }
    }

    const [historyEntry] = await db
      .insert(notificationHistory)
      .values({
        userId,
        alertId: validatedData.alertId || null,
        notificationType: validatedData.notificationType,
        channel: validatedData.channel,
        title: validatedData.title,
        message: validatedData.message,
        status: validatedData.status,
        sentAt: new Date(),
        deliveredAt: validatedData.deliveredAt ? new Date(validatedData.deliveredAt) : null,
        readAt: validatedData.readAt ? new Date(validatedData.readAt) : null,
        metadata: validatedData.metadata,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: historyEntry,
      message: 'Notification history entry recorded successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to record notification history:', error);
    return NextResponse.json(
      { error: 'Failed to record notification history' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/history - Clear notification history (with optional filters)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const olderThanDays = searchParams.get('olderThanDays');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    const whereConditions = [eq(notificationHistory.userId, userId)];

    // Filter by age
    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
      whereConditions.push(sql`${notificationHistory.createdAt} < ${cutoffDate}`);
    }

    // Filter by channel
    if (channel && channel !== 'all') {
      whereConditions.push(eq(notificationHistory.channel, channel));
    }

    // Filter by status
    if (status && status !== 'all') {
      whereConditions.push(eq(notificationHistory.status, status));
    }

    const deletedEntries = await db
      .delete(notificationHistory)
      .where(and(...whereConditions))
      .returning({ id: notificationHistory.id });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedEntries.length,
      },
      message: `Successfully deleted ${deletedEntries.length} notification history entries`,
    });

  } catch (error) {
    console.error('Failed to delete notification history:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification history' },
      { status: 500 }
    );
  }
}
