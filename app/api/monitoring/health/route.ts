import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/monitoring/health — API health summary (CORE)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setHours(since.getHours() - 24);

  const [totalCalls, errorCount, avgDuration] = await Promise.all([
    prisma.apiHealthLog.count({ where: { createdAt: { gte: since } } }),
    prisma.apiHealthLog.count({ where: { createdAt: { gte: since }, statusCode: { gte: 400 } } }),
    prisma.apiHealthLog.aggregate({ where: { createdAt: { gte: since } }, _avg: { durationMs: true } }),
  ]);

  const errorRate = totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(2) : "0";
  const uptime = totalCalls > 0 ? (((totalCalls - errorCount) / totalCalls) * 100).toFixed(2) : "100";

  return NextResponse.json({
    totalCalls,
    errorCount,
    errorRate: `${errorRate}%`,
    avgDurationMs: Math.round(avgDuration._avg.durationMs ?? 0),
    uptime: `${uptime}%`,
    period: "24h",
  });
}
