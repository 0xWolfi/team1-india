import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { canEditTeamForRun, getRunBySlug } from "@/lib/speedrun";
import { sendEmail, getSpeedrunLeaveTeamEmail } from "@/lib/email";

// POST /api/speedrun/runs/[slug]/teams/leave
// Slug-scoped leave-team. Locked once the run is past submission close.
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
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  if (!canEditTeamForRun(run.status)) {
    return NextResponse.json(
      { error: "Team changes are locked for this run" },
      { status: 409 }
    );
  }

  const registration = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail } },
    include: {
      team: { include: { members: { orderBy: { joinedAt: "asc" } } } },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "You are not registered" }, { status: 404 });
  }
  if (!registration.team || !registration.teamId) {
    return NextResponse.json({ error: "You are not part of a team" }, { status: 400 });
  }

  const team = registration.team;
  const teamId = team.id;
  const wasCaptain = team.captainEmail === userEmail;
  const remainingMembers = team.members.filter((m) => m.email !== userEmail);

  const emailContext = {
    fullName: registration.fullName,
    runSlug: run.slug,
    runLabel: run.monthLabel,
    teamName: team.name || team.code,
  };

  await prisma.speedrunTeamMember.deleteMany({
    where: { teamId, email: userEmail },
  });

  await prisma.speedrunRegistration.update({
    where: { id: registration.id },
    data: { teamId: null, teamMode: "solo" },
  });

  let teamDisbanded = false;
  let newCaptainEmail: string | null = null;
  if (remainingMembers.length === 0) {
    await prisma.speedrunTeam.delete({ where: { id: teamId } });
    teamDisbanded = true;
  } else if (wasCaptain) {
    const newCaptain = remainingMembers[0];
    await prisma.$transaction([
      prisma.speedrunTeam.update({
        where: { id: teamId },
        data: { captainEmail: newCaptain.email },
      }),
      prisma.speedrunTeamMember.update({
        where: { teamId_email: { teamId, email: newCaptain.email } },
        data: { role: "captain" },
      }),
    ]);
    newCaptainEmail = newCaptain.email;
  }

  const emailContent = getSpeedrunLeaveTeamEmail(emailContext);
  sendEmail({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  }).catch((err) => {
    console.error("[speedrun] failed to send leave-team email:", err);
  });

  return NextResponse.json({
    ok: true,
    ...(teamDisbanded && { teamDisbanded: true }),
    ...(newCaptainEmail && { newCaptainEmail }),
  });
}
