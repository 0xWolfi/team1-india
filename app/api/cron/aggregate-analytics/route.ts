import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET/POST /api/cron/aggregate-analytics — daily aggregation (runs at 2 AM)
export async function GET(request: NextRequest) { return POST(request); }

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Aggregate yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date(yesterday);
  today.setDate(today.getDate() + 1);

  const [pageViews, uniqueVisitors, customEvents] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: yesterday, lt: today } } }),
    prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "page_view", createdAt: { gte: yesterday, lt: today } } }).then((r) => r.length),
    prisma.analyticsEvent.groupBy({ by: ["name"], where: { type: "custom", createdAt: { gte: yesterday, lt: today } }, _count: true }),
  ]);

  // Upsert daily stats
  await prisma.analyticsDailyStat.upsert({
    where: { date_metric: { date: yesterday, metric: "page_views" } },
    update: { value: pageViews },
    create: { date: yesterday, metric: "page_views", value: pageViews },
  });

  await prisma.analyticsDailyStat.upsert({
    where: { date_metric: { date: yesterday, metric: "unique_visitors" } },
    update: { value: uniqueVisitors },
    create: { date: yesterday, metric: "unique_visitors", value: uniqueVisitors },
  });

  for (const evt of customEvents) {
    await prisma.analyticsDailyStat.upsert({
      where: { date_metric: { date: yesterday, metric: evt.name } },
      update: { value: evt._count },
      create: { date: yesterday, metric: evt.name, value: evt._count },
    });
  }

  // Optional: delete raw events older than 90 days
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - 90);
  const deleted = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: retentionDate } } });

  return NextResponse.json({ success: true, date: yesterday.toISOString().split("T")[0], pageViews, uniqueVisitors, customEvents: customEvents.length, deletedOld: deleted.count });
}
