import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Lazy initialization of VAPID details
let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@team1india.com',
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!ensureVapidConfigured()) {
      return Response.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, notification } = await request.json();

    // IDOR check: only allow sending to self or if CORE
    if (userId !== session.user.id && session.user.role !== 'CORE') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

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
