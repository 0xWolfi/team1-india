import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
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
    if (userId !== session.user.id && session.user.role !== 'CORE') { // Changed ADMIN to CORE based on auth-options
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try finding Member first
    let preferences = null;
    
    // @ts-ignore - Prisma types not syncing yet
    const member = await prisma.member.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (member) {
      preferences = member.notificationPreferences;
    } else {
      // Try CommunityMember
      // @ts-ignore
      const communityMember = await prisma.communityMember.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });
      
      if (communityMember) {
        preferences = communityMember.notificationPreferences;
      }
    }

    if (!preferences) {
      // Return defaults
      return Response.json({
        enabled: false,
        categories: {
          applications: true,
          experiments: true,
          contributions: true,
          playbooks: false,
          announcements: true,
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
          timezone: 'auto',
        },
        maxPerHour: 3,
      });
    }

    return Response.json(preferences);
  } catch (error) {
    console.error('Preferences get error:', error);
    return Response.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const preferences = await request.json();

    // Try updating Member first
    const member = await prisma.member.findUnique({ where: { id: userId } });

    if (member) {
      // @ts-ignore
      await prisma.member.update({
        where: { id: userId },
        data: { notificationPreferences: preferences },
      });
    } else {
      // Try CommunityMember
      // @ts-ignore
      const communityMember = await prisma.communityMember.findUnique({ where: { id: userId } });
      if (communityMember) {
        // @ts-ignore
        await prisma.communityMember.update({
          where: { id: userId },
          data: { notificationPreferences: preferences },
        });
      } else {
         return Response.json({ error: 'User not found' }, { status: 404 });
      }
    }

    console.log(`✅ Notification preferences updated for user ${userId}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Preferences update error:', error);
    return Response.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
