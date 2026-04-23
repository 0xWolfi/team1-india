import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/funnel — funnel analysis (CORE only)
// Example: ?steps=page_view,quest_completed,swag_redeemed&days=30
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const steps = (searchParams.get("steps") || "page_view,quest_completed").split(",");
  const days = Number(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await Promise.all(
    steps.map(async (step) => {
      const count = await prisma.analyticsEvent.groupBy({
        by: ["sessionId"],
        where: { name: step, createdAt: { gte: since } },
      });
      return { step, count: count.length };
    })
  );

  return NextResponse.json({ funnel: results, period: `${days} days` });
}
