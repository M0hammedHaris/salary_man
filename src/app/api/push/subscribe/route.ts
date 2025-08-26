import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// POST /api/push/subscribe - Register push subscription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = pushSubscriptionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const subscription = validation.data;

    // For now, we'll log the subscription
    // In production, store in database
    console.log('PUSH SUBSCRIPTION REGISTERED:', {
      userId,
      endpoint: subscription.endpoint,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store subscription in database
    /*
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dhKey: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
      createdAt: new Date(),
      isActive: true,
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
    });

  } catch (error) {
    console.error('POST /api/push/subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to register push subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe - Unregister push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    // TODO: Remove subscription from database
    /*
    await db.delete(pushSubscriptions).where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
    */

    console.log('PUSH SUBSCRIPTION UNREGISTERED:', {
      userId,
      endpoint,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription unregistered successfully',
    });

  } catch (error) {
    console.error('DELETE /api/push/subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unregister push subscription' },
      { status: 500 }
    );
  }
}
