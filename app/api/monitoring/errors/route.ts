import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/monitoring/errors — recent errors (CORE)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const errors = await prisma.apiHealthLog.findMany({
    where: { statusCode: { gte: 400 } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      endpoint: true,
      method: true,
      statusCode: true,
      durationMs: true,
      error: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ errors });
}
