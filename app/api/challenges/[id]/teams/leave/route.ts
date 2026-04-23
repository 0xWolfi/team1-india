import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// POST /api/challenges/[id]/teams/leave — member leaves team
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.challengeTeamMember.findFirst({
    where: { email: session.user.email, registration: { challengeId: id } },
    include: { registration: true },
  });

  if (!member) return NextResponse.json({ error: "Not on a team" }, { status: 404 });
  if (member.role === "captain") return NextResponse.json({ error: "Captain cannot leave — transfer or disband" }, { status: 400 });

  await prisma.challengeTeamMember.delete({ where: { id: member.id } });

  await sendNotification(member.registration.captainEmail, "team_leave", "Team Member Left", `${session.user.email} left your team`);

  return NextResponse.json({ success: true });
}
