import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Lazy VAPID configuration — mirrors /api/push/send/route.ts so we can send
// push from server-side run lifecycle events without going through that route.
let vapidConfigured = false;
function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@team1india.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

interface BroadcastPayload {
  /** Notification heading. */
  title: string;
  /** Notification body / preview text. */
  body: string;
  /** Optional click-through URL — passed through to the SW notification. */
  url?: string;
}

/**
 * Resolve a list of emails → userIds across Member / CommunityMember / PublicUser.
 *
 * `PushSubscription.userId` is set from `session.user.id`, which can be the
 * id of any of the three user tables depending on the registrant's tier.
 * We look up in all three and union the results — emails not found in any
 * table are simply skipped (they're registrants without an account, which
 * shouldn't happen but be defensive).
 */
async function resolveUserIdsByEmail(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  const [members, community, publics] = await Promise.all([
    prisma.member.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    }),
    prisma.communityMember.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    }),
    prisma.publicUser.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    }),
  ]);
  return [
    ...members.map((m) => m.id),
    ...community.map((c) => c.id),
    ...publics.map((p) => p.id),
  ];
}

/**
 * Send a web push to every push subscription belonging to the given emails.
 * Fails soft — logs errors and prunes 410-Gone subscriptions but never throws
 * to the caller.
 */
export async function pushBroadcastToEmails(
  emails: string[],
  payload: BroadcastPayload
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0, skipped: emails.length };
  }
  const userIds = await resolveUserIdsByEmail(emails);
  if (userIds.length === 0) return { sent: 0, failed: 0, skipped: emails.length };

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds }, deletedAt: null },
  });
  if (subs.length === 0) return { sent: 0, failed: 0, skipped: 0 };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
  });

  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keys: sub.keys as any,
          },
          body
        );
        sent++;
      } catch (err) {
        failed++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusCode = (err as any)?.statusCode;
        if (statusCode === 410) {
          // Subscription expired — soft-delete so future broadcasts skip it.
          await prisma.pushSubscription
            .update({
              where: { id: sub.id },
              data: { deletedAt: new Date() },
            })
            .catch(() => {});
        } else {
          console.error("[speedrunNotify] push failed:", err);
        }
      }
    })
  );
  return { sent, failed, skipped: 0 };
}

/**
 * Send a plain email broadcast to a list of recipients. Each email is sent
 * individually to keep blast-radius small — one failure never poisons others.
 * Fails soft.
 */
export async function emailBroadcast(
  emails: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  await Promise.all(
    emails.map(async (to) => {
      try {
        await sendEmail({ to, subject, html });
        sent++;
      } catch (err) {
        failed++;
        console.error("[speedrunNotify] email failed for", to, err);
      }
    })
  );
  return { sent, failed };
}

/**
 * High-level: notify all registrants of a Speedrun run via both push and
 * (optionally) email. `runId` is the SpeedrunRun.id; we pull all
 * registrant emails and broadcast.
 *
 * Always returns counts; never throws.
 */
export async function broadcastToRunRegistrants(
  runId: string,
  payload: BroadcastPayload & { email?: { subject: string; html: string } }
): Promise<{
  push: { sent: number; failed: number; skipped: number };
  email: { sent: number; failed: number } | null;
  recipients: number;
}> {
  const regs = await prisma.speedrunRegistration.findMany({
    where: { runId, status: { in: ["registered", "confirmed"] } },
    select: { userEmail: true },
  });
  const emails = Array.from(new Set(regs.map((r) => r.userEmail)));
  if (emails.length === 0) {
    return {
      push: { sent: 0, failed: 0, skipped: 0 },
      email: null,
      recipients: 0,
    };
  }

  const push = await pushBroadcastToEmails(emails, payload);
  const email = payload.email
    ? await emailBroadcast(emails, payload.email.subject, payload.email.html)
    : null;

  return { push, email, recipients: emails.length };
}
