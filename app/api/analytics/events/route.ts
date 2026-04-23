import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/events — raw events (CORE only, paginated)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
  const type = searchParams.get("type");
  const name = searchParams.get("name");

  const where: any = {};
  if (type) where.type = type;
  if (name) where.name = { contains: name, mode: "insensitive" };

  const events = await prisma.analyticsEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = events.length > limit;
  if (hasMore) events.pop();

  return NextResponse.json({
    events,
    nextCursor: hasMore ? events[events.length - 1]?.id : null,
  });
}
