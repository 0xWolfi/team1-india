import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// POST /api/challenges/[id]/teams/respond — accept/decline invite
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await request.json(); // "accept" or "decline"

  if (!["accept", "decline"].includes(action)) return NextResponse.json({ error: "action must be accept or decline" }, { status: 400 });

  const member = await prisma.challengeTeamMember.findFirst({
    where: { email: session.user.email, status: "pending", registration: { challengeId: id } },
    include: { registration: true },
  });
  if (!member) return NextResponse.json({ error: "No pending invite" }, { status: 404 });

  await prisma.challengeTeamMember.update({
    where: { id: member.id },
    data: { status: action === "accept" ? "accepted" : "declined" },
  });

  // Notify captain
  const challenge = await prisma.challenge.findUnique({ where: { id }, select: { title: true } });
  await sendNotification(
    member.registration.captainEmail,
    action === "accept" ? "team_accept" : "team_decline",
    action === "accept" ? "Invite Accepted" : "Invite Declined",
    `${session.user.email} ${action}ed your invite for "${challenge?.title}"`,
  );

  return NextResponse.json({ success: true });
}
