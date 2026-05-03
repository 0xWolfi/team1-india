import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getRunBySlug, MAX_TEAM_SIZE } from "@/lib/speedrun";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/speedrun/runs/[slug]/teams/lookup?code=XXXXXX
// Slug-scoped team lookup — verifies the team exists and belongs to this run.
// Rate-limited to deter brute-force enumeration of team codes.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 60 requests / minute / IP — generous for legit typing-debounced lookups,
  // tight enough to make code-space enumeration infeasible.
  const rl = await checkRateLimit(request, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many lookups — try again in a minute" },
      { status: 429 }
    );
  }

  const { slug } = await params;
  const run = await getRunBySlug(slug);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

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
      team1Id: team.code,
      memberCount: team._count.members,
      isFull: team._count.members >= MAX_TEAM_SIZE,
    },
  });
}
