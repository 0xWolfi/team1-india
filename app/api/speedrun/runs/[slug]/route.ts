import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { checkSpeedrunAccess } from "@/lib/permissions";
import { RUN_STATUSES } from "@/lib/speedrun";
import { logAudit } from "@/lib/audit";
import { broadcastToRunRegistrants } from "@/lib/speedrunNotify";
import { getSpeedrunBroadcastEmail } from "@/lib/email";

// GET /api/speedrun/runs/[slug] — full run record + tracks (admin)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "READ");
  if (!access.authorized) return access.response!;

  const { slug } = await params;
  const run = await prisma.speedrunRun.findFirst({
    where: { slug, deletedAt: null },
    include: {
      tracks: { orderBy: { sortOrder: "asc" } },
      _count: { select: { registrations: true, teams: true, projects: true } },
    },
  });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ run });
}

// PATCH /api/speedrun/runs/[slug] — update run fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const { slug } = await params;
  const body = await request.json();

  const target = await prisma.speedrunRun.findFirst({
    where: { slug, deletedAt: null },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Whitelist of editable fields — guard against arbitrary writes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.monthLabel !== undefined) data.monthLabel = body.monthLabel;
  if (body.theme !== undefined) data.theme = body.theme;
  if (body.themeDescription !== undefined) data.themeDescription = body.themeDescription;
  if (body.status !== undefined) {
    if (!RUN_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  for (const key of [
    "startDate",
    "endDate",
    "registrationDeadline",
    "submissionOpenDate",
    "irlEventDate",
    "winnersDate",
  ] as const) {
    if (body[key] !== undefined) {
      data[key] = body[key] ? new Date(body[key]) : null;
    }
  }
  if (body.sponsors !== undefined) data.sponsors = body.sponsors;
  if (body.prizePool !== undefined) data.prizePool = body.prizePool;
  if (body.hostCities !== undefined) {
    data.hostCities = Array.isArray(body.hostCities)
      ? body.hostCities.filter((c: unknown) => typeof c === "string")
      : [];
  }
  if (body.faq !== undefined) data.faq = body.faq;

  // Slug rename — validate format and uniqueness, and refuse if anyone has
  // registered yet. Slugs are baked into emails, sessionStorage redirects, and
  // referral URLs in the wild — renaming after registrations exist would
  // break links for users who already received confirmation emails.
  if (body.slug !== undefined && body.slug !== target.slug) {
    if (typeof body.slug !== "string" || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(body.slug)) {
      return NextResponse.json(
        { error: "slug must be lowercase alphanumerics + hyphens" },
        { status: 400 }
      );
    }
    const regCount = await prisma.speedrunRegistration.count({
      where: { runId: target.id },
    });
    if (regCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot rename slug — ${regCount} registration${
            regCount === 1 ? " has" : "s have"
          } already been confirmed under "${target.slug}". Renaming would break email and referral links already sent.`,
        },
        { status: 409 }
      );
    }
    const dupe = await prisma.speedrunRun.findUnique({ where: { slug: body.slug } });
    if (dupe) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    data.slug = body.slug;
  }

  const run = await prisma.speedrunRun.update({
    where: { id: target.id },
    data,
    include: { tracks: { orderBy: { sortOrder: "asc" } } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
  await logAudit({
    action: "UPDATE",
    resource: "SPEEDRUN_RUN",
    resourceId: run.id,
    actorId,
    metadata: { slug: run.slug, changedKeys: Object.keys(data) },
  });

  // Detect notify-worthy transitions and broadcast to all registrants.
  // Compared against the original `target` snapshot. Fire-and-forget so the
  // PATCH response stays fast — failures only log.
  void maybeBroadcastTransitions(target, run);

  return NextResponse.json({ run });
}

/**
 * Compare before/after run state and dispatch broadcasts when notable
 * transitions happen:
 *   - Theme set for the first time (theme: null → non-empty)
 *   - status: registration_open → submissions_open  ("Build window opens.")
 *   - status: submissions_open → submissions_closed ("Submissions are closed.")
 *   - status: any → completed                       ("Winners are out.")
 *
 * Each broadcast goes to all registrants via push (best-effort) and email.
 */
async function maybeBroadcastTransitions(
  before: { theme: string | null; status: string; slug: string; monthLabel: string },
  after: { id: string; slug: string; monthLabel: string; theme: string | null; status: string }
) {
  try {
    const broadcasts: Array<{ headline: string; body: string; ctaLabel?: string }> = [];

    if (!before.theme && after.theme) {
      broadcasts.push({
        headline: "Theme drops.",
        body: `The theme for Speedrun ${after.monthLabel} is "${after.theme}". You have until submissions close to ship. Open the run page for details, tracks, and prize info.`,
        ctaLabel: "See Theme",
      });
    }
    if (before.status !== after.status) {
      if (after.status === "submissions_open") {
        broadcasts.push({
          headline: "Submissions open.",
          body: `The submission portal is live for Speedrun ${after.monthLabel}. Build your project, fill in the links, ship it. Edits stay open until close.`,
          ctaLabel: "Submit Project",
        });
      } else if (after.status === "submissions_closed") {
        broadcasts.push({
          headline: "Submissions closed.",
          body: `Submissions are now closed for Speedrun ${after.monthLabel}. Edits to submitted projects are still allowed — every save is versioned. IRL meet and judging come next.`,
        });
      } else if (after.status === "completed") {
        broadcasts.push({
          headline: "Winners are out.",
          body: `Speedrun ${after.monthLabel} wrapped — head to the run page to see winners, projects, and the recap.`,
          ctaLabel: "See Recap",
        });
      }
    }

    for (const b of broadcasts) {
      const emailContent = getSpeedrunBroadcastEmail({
        runSlug: after.slug,
        runLabel: after.monthLabel,
        headline: b.headline,
        body: b.body,
        ctaLabel: b.ctaLabel,
      });
      const result = await broadcastToRunRegistrants(after.id, {
        title: `Speedrun ${after.monthLabel} — ${b.headline}`,
        body: b.body,
        url: `/speedrun/${encodeURIComponent(after.slug)}`,
        email: { subject: emailContent.subject, html: emailContent.html },
      });
      console.log(
        `[speedrun] broadcast "${b.headline}" sent — recipients=${result.recipients} push=${result.push.sent}/${result.push.failed} email=${result.email?.sent}/${result.email?.failed}`
      );
    }
  } catch (err) {
    console.error("[speedrun] broadcast failed:", err);
  }
}

// DELETE /api/speedrun/runs/[slug] — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const { slug } = await params;
  const target = await prisma.speedrunRun.findFirst({
    where: { slug, deletedAt: null },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Refuse to delete the current run — operator must promote another first.
  if (target.isCurrent) {
    return NextResponse.json(
      { error: "Cannot delete the current run — promote another run first" },
      { status: 409 }
    );
  }

  await prisma.speedrunRun.update({
    where: { id: target.id },
    data: { deletedAt: new Date() },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
  await logAudit({
    action: "DELETE",
    resource: "SPEEDRUN_RUN",
    resourceId: target.id,
    actorId,
    metadata: { slug: target.slug },
  });

  return NextResponse.json({ ok: true });
}
