import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/monitoring/slow — slowest endpoints (CORE)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setHours(since.getHours() - 24);

  const slow = await prisma.apiHealthLog.groupBy({
    by: ["endpoint", "method"],
    where: { createdAt: { gte: since } },
    _avg: { durationMs: true },
    _max: { durationMs: true },
    _count: true,
    orderBy: { _avg: { durationMs: "desc" } },
    take: 20,
  });

  return NextResponse.json({
    endpoints: slow.map((s) => ({
      endpoint: s.endpoint,
      method: s.method,
      avgMs: Math.round(s._avg.durationMs ?? 0),
      maxMs: s._max.durationMs,
      calls: s._count,
    })),
  });
}
