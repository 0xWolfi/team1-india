import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// POST /api/challenges/[id]/teams/remove — captain removes member
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const registration = await prisma.challengeRegistration.findUnique({
    where: { challengeId_captainEmail: { challengeId: id, captainEmail: session.user.email } },
  });
  if (!registration) return NextResponse.json({ error: "Not captain" }, { status: 403 });

  const member = await prisma.challengeTeamMember.findFirst({
    where: { registrationId: registration.id, email, role: "member" },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.challengeTeamMember.delete({ where: { id: member.id } });

  const challenge = await prisma.challenge.findUnique({ where: { id }, select: { title: true } });
  await sendNotification(email, "team_removed", "Removed from Team", `You were removed from the team for "${challenge?.title}"`);

  return NextResponse.json({ success: true });
}
