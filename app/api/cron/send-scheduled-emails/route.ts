import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET/POST /api/cron/send-scheduled-emails — runs every 15 min
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const emails = await prisma.scheduledEmail.findMany({
    where: { status: "scheduled", scheduledFor: { lte: now } },
    include: { challenge: { select: { id: true, title: true } } },
  });

  let sent = 0;
  for (const email of emails) {
    await prisma.scheduledEmail.update({ where: { id: email.id }, data: { status: "sending" } });

    try {
      // Resolve recipients
      let recipients: string[] = [];

      if (email.recipientType === "custom") {
        recipients = email.customEmails;
      } else {
        const registrations = await prisma.challengeRegistration.findMany({
          where: { challengeId: email.challengeId },
          select: { captainEmail: true, teamMembers: { select: { email: true, status: true } } },
        });

        const allEmails = new Set<string>();
        for (const reg of registrations) {
          allEmails.add(reg.captainEmail);
          for (const m of reg.teamMembers) {
            if (m.status === "accepted") allEmails.add(m.email);
          }
        }

        if (email.recipientType === "all_registered") {
          recipients = [...allEmails];
        } else if (email.recipientType === "all_submitted") {
          const submissions = await prisma.challengeSubmission.findMany({
            where: { challengeId: email.challengeId },
            select: { teamEmail: true },
          });
          recipients = submissions.map((s) => s.teamEmail);
        } else if (email.recipientType === "winners") {
          const winners = await prisma.challengeWinner.findMany({
            where: { challengeId: email.challengeId, isPublished: true },
            select: { teamEmail: true },
          });
          recipients = winners.map((w) => w.teamEmail);
        }
      }

      // Send emails (batch)
      for (const to of recipients) {
        await sendEmail({ to, subject: email.subject, html: email.body }).catch((err) =>
          console.error(`Failed to send to ${to}:`, err)
        );
      }

      await prisma.scheduledEmail.update({ where: { id: email.id }, data: { status: "sent", sentAt: new Date() } });
      sent++;
    } catch (err) {
      console.error(`Failed to process email ${email.id}:`, err);
      await prisma.scheduledEmail.update({ where: { id: email.id }, data: { status: "scheduled" } }); // retry next cycle
    }
  }

  return NextResponse.json({ success: true, processed: emails.length, sent });
}
