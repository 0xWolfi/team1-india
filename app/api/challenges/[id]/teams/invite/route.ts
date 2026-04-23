import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// POST /api/challenges/[id]/teams/invite — invite team member
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const registration = await prisma.challengeRegistration.findUnique({
    where: { challengeId_captainEmail: { challengeId: id, captainEmail: session.user.email } },
    include: { teamMembers: true },
  });
  if (!registration) return NextResponse.json({ error: "Not registered as captain" }, { status: 403 });

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (registration.teamMembers.length >= (challenge?.maxTeamSize ?? 4)) {
    return NextResponse.json({ error: "Team is full" }, { status: 400 });
  }

  if (registration.teamMembers.some((m) => m.email === email)) {
    return NextResponse.json({ error: "Already on team" }, { status: 409 });
  }

  const member = await prisma.challengeTeamMember.create({
    data: { registrationId: registration.id, email, role: "member", status: "pending" },
  });

  await sendNotification(email, "team_invite", "Team Invite", `You've been invited to join "${challenge?.title}" by ${session.user.email}`, `/public/challenges/${challenge?.slug}`);

  return NextResponse.json({ member }, { status: 201 });
}
