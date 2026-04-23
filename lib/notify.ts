import { prisma } from "@/lib/prisma";
import webpush from "web-push";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@team1india.com",
    pub,
    priv
  );
  vapidConfigured = true;
  return true;
}

/**
 * Send an in-app notification (persisted to DB).
 * Optionally also sends a web push notification.
 *
 * @param userEmail - recipient email
 * @param type - notification type (e.g. "quest_approved", "team_invite")
 * @param title - short title
 * @param message - description
 * @param link - optional link to navigate to
 * @param options - optional: sendPush (default true)
 */
export async function sendNotification(
  userEmail: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  options?: { sendPush?: boolean }
): Promise<void> {
  const { sendPush = true } = options ?? {};

  // 1. Persist to DB (always)
  await prisma.notification.create({
    data: { userEmail, type, title, message, link },
  });

  // 2. Send web push (best-effort, never throws)
  if (sendPush) {
    sendPushToUser(userEmail, { title, body: message, link }).catch(() => {});
  }
}

/**
 * Send a notification to multiple users at once.
 */
export async function sendBulkNotification(
  userEmails: string[],
  type: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  // Batch create DB notifications
  await prisma.notification.createMany({
    data: userEmails.map((userEmail) => ({
      userEmail,
      type,
      title,
      message,
      link,
    })),
  });

  // Send push to all (best-effort)
  for (const email of userEmails) {
    sendPushToUser(email, { title, body: message, link }).catch(() => {});
  }
}

/**
 * Internal: send web push to all devices of a user by email.
 * Looks up userId from Member/CommunityMember/PublicUser, then finds PushSubscriptions.
 */
async function sendPushToUser(
  email: string,
  payload: { title: string; body: string; link?: string }
): Promise<void> {
  if (!ensureVapid()) return;

  // Find userId across all user tables
  const userId = await findUserId(email);
  if (!userId) return;

  // @ts-ignore - PushSubscription uses any due to soft-delete extension
  const subscriptions = await (prisma as any).pushSubscription.findMany({
    where: { userId },
  });

  if (!subscriptions.length) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    message: payload.body,
    link: payload.link || "/",
  });

  await Promise.allSettled(
    subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          pushPayload
        );
      } catch (err: any) {
        if (err?.statusCode === 410) {
          // Subscription expired — clean up
          // @ts-ignore
          await (prisma as any).pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        }
      }
    })
  );
}

async function findUserId(email: string): Promise<string | null> {
  const member = await prisma.member.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (member) return member.id;

  // @ts-ignore
  const cm = await prisma.communityMember.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (cm) return cm.id;

  const pu = await prisma.publicUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (pu) return pu.id;

  return null;
}
