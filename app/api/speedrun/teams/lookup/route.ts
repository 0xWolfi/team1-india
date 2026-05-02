import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getCurrentRun, MAX_TEAM_SIZE } from "@/lib/speedrun";

// GET /api/speedrun/teams/lookup?code=XXXXXX — preview a team before joining (auth-required)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const run = await getCurrentRun();
  const team = await prisma.speedrunTeam.findUnique({
    where: { code },
    include: { _count: { select: { members: true } } },
  });
  if (!team || team.runId !== run.id) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    team: {
      id: team.id,
      name: team.name,
      code: team.code,
      captainEmail: team.captainEmail,
      memberCount: team._count.members,
      isFull: team._count.members >= MAX_TEAM_SIZE,
    },
  });
}
