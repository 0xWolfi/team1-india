import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/notifications — fetch own notifications
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: any = { userEmail: session.user.email };
  if (unreadOnly) where.isRead = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();

  const unreadCount = await prisma.notification.count({
    where: { userEmail: session.user.email, isRead: false },
  });

  return NextResponse.json({
    notifications,
    unreadCount,
    nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
  });
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userEmail: session.user.email, isRead: false },
      data: { isRead: true },
    });
  } else if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userEmail: session.user.email },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
