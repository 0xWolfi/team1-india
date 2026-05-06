import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import {
  canEditTeamForRun,
  generateUniqueTeamCode,
  getRunBySlug,
} from "@/lib/speedrun";

// POST /api/speedrun/runs/[slug]/teams/create
// Promote a solo registrant to a team captain. The user must already be
// registered. They must currently NOT be on a team. Generates a fresh Team1 ID
// and points the existing registration at it.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  const { slug } = await params;
  const run = await getRunBySlug(slug);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (!canEditTeamForRun(run.status)) {
    return NextResponse.json({ error: "Team changes are locked" }, { status: 409 });
  }

  const reg = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail } },
  });
  if (!reg) return NextResponse.json({ error: "You are not registered" }, { status: 404 });
  if (reg.teamId) {
    return NextResponse.json({ error: "Leave your current team first" }, { status: 409 });
  }

  const code = await generateUniqueTeamCode();
  const team = await prisma.speedrunTeam.create({
    data: {
      runId: run.id,
      code,
      captainEmail: userEmail,
      members: { create: { email: userEmail, role: "captain" } },
    },
  });

  await prisma.speedrunRegistration.update({
    where: { id: reg.id },
    data: { teamId: team.id, teamMode: "create" },
  });

  return NextResponse.json({ ok: true, team1Id: team.code });
}
