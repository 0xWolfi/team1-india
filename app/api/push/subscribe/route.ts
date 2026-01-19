import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, subscription } = await request.json();

    // Verify userId matches session
    // @ts-ignore
    if (userId !== session.user.id && session.user.role !== 'CORE') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if subscription already exists
    // @ts-ignore
    const existing = await (prisma as any).pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint }
    });

    if (existing) {
        // @ts-ignore
        await (prisma as any).pushSubscription.update({
            where: { endpoint: subscription.endpoint },
            data: { 
                lastUsed: new Date(),
                userId: userId // Updated owner if needed
            }
        });
    } else {
        // @ts-ignore
        await (prisma as any).pushSubscription.create({
          data: {
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            userAgent: request.headers.get('user-agent') || null,
          },
        });
    }

    console.log(`✅ Push subscription saved for user ${userId}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Subscription save error:', error);
    return Response.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
