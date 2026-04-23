import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/stats — dashboard stats (CORE only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [pageViews, uniqueVisitors, topPages, topReferrers, deviceBreakdown, dailyStats] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "page_view", createdAt: { gte: since } }, _count: true }).then((r) => r.length),
    prisma.analyticsEvent.groupBy({ by: ["path"], where: { type: "page_view", createdAt: { gte: since }, path: { not: null } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ["referrer"], where: { type: "page_view", createdAt: { gte: since }, referrer: { not: null } }, _count: { _all: true }, orderBy: { _count: { referrer: "desc" } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ["device"], where: { type: "page_view", createdAt: { gte: since }, device: { not: null } }, _count: { _all: true } }),
    prisma.analyticsDailyStat.findMany({ where: { date: { gte: since }, metric: "page_views" }, orderBy: { date: "asc" } }),
  ]);

  return NextResponse.json({
    pageViews,
    uniqueVisitors,
    topPages: topPages.map((p) => ({ path: p.path, count: p._count._all })),
    topReferrers: topReferrers.map((r) => ({ referrer: r.referrer, count: r._count._all })),
    deviceBreakdown: deviceBreakdown.map((d) => ({ device: d.device, count: d._count._all })),
    dailyStats,
  });
}
