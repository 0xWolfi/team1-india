import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@team1india.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, notification } = await request.json();

    // Get all subscriptions for user
    // @ts-ignore
    const subscriptions = await (prisma as any).pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions.length) {
      return NextResponse.json({ success: true, count: 0 }); // No subs, but success
    }

    const payload = JSON.stringify(notification);

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );
          return { success: true };
        } catch (error) {
          console.error("Error sending push:", error);
          // @ts-ignore
          if (error.statusCode === 410) {
            // Expired/Gone - delete
             // @ts-ignore
            await (prisma as any).pushSubscription.delete({
                where: { id: sub.id }
            });
          }
          return { success: false, error };
        }
      })
    );

    const successCount = results.filter((r: any) => r.success).length;
    const failureCount = results.filter((r: any) => !r.success).length;

    console.log(`📤 Push sent: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error('Push send error:', error);
    return Response.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}
