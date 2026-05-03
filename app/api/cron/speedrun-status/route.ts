import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { broadcastToRunRegistrants } from "@/lib/speedrunNotify";
import { getSpeedrunBroadcastEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily cron: auto-transition Speedrun runs based on their configured dates.
 *
 *   submissionOpenDate ≤ today  →  registration_open → submissions_open
 *   registrationDeadline < today →  submissions_open → submissions_closed
 *   irlEventDate ≤ today < winnersDate → submissions_closed → irl_event
 *   winnersDate ≤ today          →  irl_event/judging → judging (still manual to "completed")
 *
 * The cron only ratchets state forward — it never reverses. Operators can
 * still manually push a status further than the date schedule would (e.g.
 * close registration early); the cron will then no-op.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  // Strip time so date comparisons are by-day (avoids timezone-edge flapping).
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const transitions: Array<{ slug: string; from: string; to: string }> = [];

  const runs = await prisma.speedrunRun.findMany({
    where: {
      deletedAt: null,
      status: { in: ["registration_open", "submissions_open", "submissions_closed", "irl_event"] },
    },
  });

  for (const run of runs) {
    let next: string | null = null;

    if (
      run.status === "registration_open" &&
      run.submissionOpenDate &&
      new Date(run.submissionOpenDate) <= today
    ) {
      next = "submissions_open";
    } else if (
      run.status === "submissions_open" &&
      run.registrationDeadline &&
      new Date(run.registrationDeadline) < now // strict — close at end of deadline date
    ) {
      next = "submissions_closed";
    } else if (
      run.status === "submissions_closed" &&
      run.irlEventDate &&
      new Date(run.irlEventDate) <= today
    ) {
      next = "irl_event";
    } else if (
      run.status === "irl_event" &&
      run.winnersDate &&
      new Date(run.winnersDate) > today
    ) {
      // After IRL but before winners date → judging
      next = "judging";
    }

    if (!next) continue;

    await prisma.speedrunRun.update({
      where: { id: run.id },
      data: { status: next },
    });
    await logAudit({
      action: "UPDATE",
      resource: "SPEEDRUN_RUN",
      resourceId: run.id,
      actorId: "cron:speedrun-status",
      metadata: { slug: run.slug, change: "auto_transition", from: run.status, to: next },
    });
    transitions.push({ slug: run.slug, from: run.status, to: next });

    // Mirror the PATCH endpoint's broadcast logic for the headline transitions.
    let headline: string | null = null;
    let body: string | null = null;
    let ctaLabel: string | undefined;
    if (next === "submissions_open") {
      headline = "Submissions open.";
      body = `The submission portal is live for Speedrun ${run.monthLabel}. Build your project, fill in the links, ship it. Edits stay open until close.`;
      ctaLabel = "Submit Project";
    } else if (next === "submissions_closed") {
      headline = "Submissions closed.";
      body = `Submissions are now closed for Speedrun ${run.monthLabel}. Edits to submitted projects are still allowed — every save is versioned. IRL meet and judging come next.`;
    }
    if (headline && body) {
      const emailContent = getSpeedrunBroadcastEmail({
        runSlug: run.slug,
        runLabel: run.monthLabel,
        headline,
        body,
        ctaLabel,
      });
      await broadcastToRunRegistrants(run.id, {
        title: `Speedrun ${run.monthLabel} — ${headline}`,
        body,
        url: `/speedrun/${encodeURIComponent(run.slug)}`,
        email: { subject: emailContent.subject, html: emailContent.html },
      }).catch((err) => console.error("[speedrun] cron broadcast failed:", err));
    }
  }

  return NextResponse.json({
    ok: true,
    checked: runs.length,
    transitioned: transitions.length,
    transitions,
  });
}
