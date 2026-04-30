import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/speedrun/registrations — admin (CORE) list of all registrations
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (runId) where.runId = runId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { userEmail: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const [registrations, runs, totalCount] = await Promise.all([
    prisma.speedrunRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true, code: true, captainEmail: true } },
        run: { select: { id: true, slug: true, monthLabel: true } },
      },
    }),
    prisma.speedrunRun.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, monthLabel: true, status: true, isCurrent: true },
    }),
    prisma.speedrunRegistration.count({ where }),
  ]);

  return NextResponse.json({ registrations, runs, totalCount });
}
