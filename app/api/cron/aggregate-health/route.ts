import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET/POST /api/cron/aggregate-health — hourly health check
export async function GET(request: NextRequest) { return POST(request); }

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const [totalCalls, errorCount, avgDuration] = await Promise.all([
    prisma.apiHealthLog.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.apiHealthLog.count({ where: { createdAt: { gte: oneHourAgo }, statusCode: { gte: 500 } } }),
    prisma.apiHealthLog.aggregate({ where: { createdAt: { gte: oneHourAgo } }, _avg: { durationMs: true } }),
  ]);

  const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;
  const avgMs = avgDuration._avg.durationMs ?? 0;

  // Alert if thresholds exceeded (log for now, notification integration available)
  if (errorRate > 5) {
    console.warn(`[Health Alert] Error rate ${errorRate.toFixed(1)}% in last hour`);
  }
  if (avgMs > 1000) {
    console.warn(`[Health Alert] Avg response time ${avgMs.toFixed(0)}ms in last hour`);
  }

  // Delete raw logs older than 30 days
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - 30);
  const deleted = await prisma.apiHealthLog.deleteMany({ where: { createdAt: { lt: retentionDate } } });

  return NextResponse.json({ success: true, totalCalls, errorRate: `${errorRate.toFixed(1)}%`, avgMs: Math.round(avgMs), deletedOld: deleted.count });
}
