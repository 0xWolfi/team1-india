import { prisma } from "@/lib/prisma";
import { sendEmail, getBountyAnnouncementEmail } from "@/lib/email";

/**
 * Pull a first-name from a full name. Falls back to the full string when there
 * is no whitespace, and to an empty string when the input is null/empty so the
 * email greeting renders "Hi there,".
 */
function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(" ");
  return idx === -1 ? trimmed : trimmed.slice(0, idx);
}

interface BroadcastResult {
  bountyId: string;
  recipients: number;
  sent: number;
  failed: number;
  skipped: boolean;       // true when announcedAt was already set
  reason?: string;
}

/**
 * Broadcast a "new bounty available" email to every active CommunityMember.
 *
 * Idempotent: refuses to fire if `Bounty.announcedAt` is already set. Marks
 * `announcedAt = now()` immediately on entry to prevent races where two
 * status-flip requests collide and both attempt to broadcast.
 *
 * Caller is expected to fire-and-forget (`void broadcastBountyAnnouncement(id)`)
 * so the admin's request returns immediately.
 */
export async function broadcastBountyAnnouncement(
  bountyId: string
): Promise<BroadcastResult> {
  const bounty = await prisma.bounty.findUnique({
    where: { id: bountyId },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      frequency: true,
      xpReward: true,
      pointsReward: true,
      deadline: true,
      status: true,
      announcedAt: true,
      deletedAt: true,
    },
  });

  if (!bounty) {
    return { bountyId, recipients: 0, sent: 0, failed: 0, skipped: true, reason: "Bounty not found" };
  }
  if (bounty.deletedAt) {
    return { bountyId, recipients: 0, sent: 0, failed: 0, skipped: true, reason: "Bounty is soft-deleted" };
  }
  if (bounty.status !== "active") {
    return { bountyId, recipients: 0, sent: 0, failed: 0, skipped: true, reason: `status is "${bounty.status}", not "active"` };
  }
  if (bounty.announcedAt) {
    return { bountyId, recipients: 0, sent: 0, failed: 0, skipped: true, reason: "already announced" };
  }

  // Claim the broadcast slot before sending any email. updateMany with the
  // announcedAt-is-null guard makes this race-safe — if a parallel call beats
  // us to the punch, the count comes back 0 and we bail.
  const claim = await prisma.bounty.updateMany({
    where: { id: bountyId, announcedAt: null },
    data: { announcedAt: new Date() },
  });
  if (claim.count === 0) {
    return { bountyId, recipients: 0, sent: 0, failed: 0, skipped: true, reason: "claim race lost" };
  }

  // Recipients: active CommunityMembers with a non-empty email.
  const recipients = await prisma.communityMember.findMany({
    where: {
      status: "active",
      deletedAt: null,
      email: { not: "" },
    },
    select: { email: true, name: true },
  });

  const content = (recipientName: string) =>
    getBountyAnnouncementEmail({
      recipientName,
      bountyTitle: bounty.title,
      bountyType: bounty.type,
      frequency: bounty.frequency,
      xpReward: bounty.xpReward,
      pointsReward: bounty.pointsReward,
      description: bounty.description,
      deadline: bounty.deadline,
    });

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      const { subject, html } = content(firstNameOf(r.name));
      await sendEmail({ to: r.email, subject, html });
      sent++;
    } catch (err) {
      failed++;
      // eslint-disable-next-line no-console
      console.error(`[bountyNotify] send failed for ${r.email}:`, err);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[bountyNotify] broadcast bounty=${bountyId} title="${bounty.title}" recipients=${recipients.length} sent=${sent} failed=${failed}`
  );

  return {
    bountyId,
    recipients: recipients.length,
    sent,
    failed,
    skipped: false,
  };
}
