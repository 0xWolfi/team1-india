import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getCurrentRun } from "@/lib/speedrun";
import { sendEmail, getSpeedrunLeaveTeamEmail } from "@/lib/email";

/**
 * POST /api/speedrun/teams/leave
 * The signed-in user leaves their team for the current run.
 * - Their registration's teamMode → "solo" and teamId → null
 * - SpeedrunTeamMember row is removed
 * - If they were captain and the team has another member, captaincy passes
 *   to the next-joined member.
 * - If they were the last member, the team is deleted.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  const run = await getCurrentRun().catch(() => null);
  if (!run) {
    return NextResponse.json({ error: "No active run" }, { status: 404 });
  }

  const registration = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail } },
    include: {
      team: {
        include: {
          members: { orderBy: { joinedAt: "asc" } },
        },
      },
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

  // Capture context needed for the confirmation email before we delete the team
  const emailContext = {
    fullName: registration.fullName,
    runLabel: run.monthLabel,
    teamName: team.name,
  };

  // 1) Drop the user's team-member row
  await prisma.speedrunTeamMember.deleteMany({
    where: { teamId, email: userEmail },
  });

  // 2) Mark the user's registration as solo
  await prisma.speedrunRegistration.update({
    where: { id: registration.id },
    data: {
      teamId: null,
      teamMode: "solo",
    },
  });

  // 3) If team is now empty, delete it
  let teamDisbanded = false;
  let newCaptainEmail: string | null = null;
  if (remainingMembers.length === 0) {
    await prisma.speedrunTeam.delete({ where: { id: teamId } });
    teamDisbanded = true;
  } else if (wasCaptain) {
    // 4) If the leaver was captain, promote the earliest-joined remaining member
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

  // Fire-and-forget confirmation email — don't block on SMTP
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
