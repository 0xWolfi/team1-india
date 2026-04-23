import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// POST /api/challenges/[id]/emails/[eid]/send-now — manual trigger (CORE)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { eid, id } = await params;

  const email = await prisma.scheduledEmail.findUnique({ where: { id: eid } });
  if (!email || email.challengeId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (email.status === "sent") return NextResponse.json({ error: "Already sent" }, { status: 400 });

  await prisma.scheduledEmail.update({ where: { id: eid }, data: { status: "sending" } });

  let recipients: string[] = [];
  if (email.recipientType === "custom") {
    recipients = email.customEmails;
  } else {
    const registrations = await prisma.challengeRegistration.findMany({
      where: { challengeId: id },
      select: { captainEmail: true, teamMembers: { select: { email: true, status: true } } },
    });
    const allEmails = new Set<string>();
    for (const reg of registrations) {
      allEmails.add(reg.captainEmail);
      for (const m of reg.teamMembers) { if (m.status === "accepted") allEmails.add(m.email); }
    }
    if (email.recipientType === "all_registered") recipients = [...allEmails];
    else if (email.recipientType === "all_submitted") {
      const subs = await prisma.challengeSubmission.findMany({ where: { challengeId: id }, select: { teamEmail: true } });
      recipients = subs.map((s) => s.teamEmail);
    } else if (email.recipientType === "winners") {
      const winners = await prisma.challengeWinner.findMany({ where: { challengeId: id, isPublished: true }, select: { teamEmail: true } });
      recipients = winners.map((w) => w.teamEmail);
    }
  }

  let sent = 0;
  for (const to of recipients) {
    await sendEmail({ to, subject: email.subject, html: email.body }).catch(() => {});
    sent++;
  }

  await prisma.scheduledEmail.update({ where: { id: eid }, data: { status: "sent", sentAt: new Date() } });
  return NextResponse.json({ success: true, sent });
}
