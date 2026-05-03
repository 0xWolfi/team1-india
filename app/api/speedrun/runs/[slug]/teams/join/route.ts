import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import {
  canEditTeamForRun,
  getRunBySlug,
  MAX_TEAM_SIZE,
} from "@/lib/speedrun";
import { sendEmail, getSpeedrunTeammateJoinedEmail } from "@/lib/email";

// POST /api/speedrun/runs/[slug]/teams/join
// Body: { teamCode: "T1-XXXXXX" }
// Move a solo registrant onto an existing team (post-registration). Must be
// already registered, not currently on a team, and the target team must have
// space and belong to the same run.
export async function POST(
  request: NextRequest,
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

  const body = await request.json();
  const teamCode =
    typeof body?.teamCode === "string" ? body.teamCode.trim().toUpperCase() : null;
  if (!teamCode) {
    return NextResponse.json({ error: "Team code is required" }, { status: 400 });
  }

  const reg = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail } },
    select: { id: true, fullName: true, teamId: true },
  });
  if (!reg) return NextResponse.json({ error: "You are not registered" }, { status: 404 });
  if (reg.teamId) {
    return NextResponse.json({ error: "Leave your current team first" }, { status: 409 });
  }

  const team = await prisma.speedrunTeam.findUnique({
    where: { code: teamCode },
    include: { _count: { select: { members: true } } },
  });
  if (!team || team.runId !== run.id) {
    return NextResponse.json({ error: "Invalid team code" }, { status: 404 });
  }
  if (team._count.members >= MAX_TEAM_SIZE) {
    return NextResponse.json(
      { error: `This team is full (max ${MAX_TEAM_SIZE} members)` },
      { status: 409 }
    );
  }

  await prisma.speedrunTeamMember.upsert({
    where: { teamId_email: { teamId: team.id, email: userEmail } },
    create: { teamId: team.id, email: userEmail, role: "member" },
    update: {},
  });

  await prisma.speedrunRegistration.update({
    where: { id: reg.id },
    data: { teamId: team.id, teamMode: "join" },
  });

  // Notify captain — fire-and-forget.
  if (team.captainEmail !== userEmail) {
    prisma.speedrunRegistration
      .findUnique({
        where: { runId_userEmail: { runId: run.id, userEmail: team.captainEmail } },
        select: { fullName: true },
      })
      .then((captainReg) => {
        const captainName = captainReg?.fullName || team.captainEmail.split("@")[0];
        const content = getSpeedrunTeammateJoinedEmail({
          captainName,
          teamName: team.code,
          runSlug: run.slug,
          runLabel: run.monthLabel,
          newMemberName: reg.fullName,
          newMemberEmail: userEmail,
        });
        return sendEmail({
          to: team.captainEmail,
          subject: content.subject,
          html: content.html,
        });
      })
      .catch((err) => {
        console.error("[speedrun] failed to notify captain on join:", err);
      });
  }

  return NextResponse.json({ ok: true, team1Id: team.code });
}
