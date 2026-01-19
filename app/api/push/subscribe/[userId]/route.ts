import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Verify userId matches session
    // @ts-ignore
    if (userId !== session.user.id && session.user.role !== 'CORE') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all subscriptions for user
    await prisma.pushSubscription.deleteMany({
      where: { userId },
    });

    console.log(`✅ Push subscriptions deleted for user ${userId}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Subscription delete error:', error);
    return Response.json(
      { error: 'Failed to delete subscriptions' },
      { status: 500 }
    );
  }
}
