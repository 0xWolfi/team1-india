import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { checkSpeedrunAccess } from "@/lib/permissions";
import { RUN_STATUSES } from "@/lib/speedrun";
import { logAudit } from "@/lib/audit";

// GET /api/speedrun/runs — admin list of all runs (CORE)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "READ");
  if (!access.authorized) return access.response!;

  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get("includeDeleted") === "1";

  const runs = await prisma.speedrunRun.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }, { createdAt: "desc" }],
    include: {
      tracks: { orderBy: { sortOrder: "asc" } },
      _count: { select: { registrations: true, teams: true, projects: true } },
    },
  });

  return NextResponse.json({ runs });
}

// POST /api/speedrun/runs — create a new run
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const body = await request.json();
  const {
    slug,
    monthLabel,
    theme,
    themeDescription,
    status,
    startDate,
    endDate,
    registrationDeadline,
    submissionOpenDate,
    irlEventDate,
    winnersDate,
    sponsors,
    prizePool,
    hostCities,
    faq,
    isCurrent,
    tracks,
  } = body || {};

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase alphanumerics + hyphens (e.g. may-26)" },
      { status: 400 }
    );
  }
  if (!monthLabel || typeof monthLabel !== "string") {
    return NextResponse.json({ error: "monthLabel is required" }, { status: 400 });
  }
  if (status && !RUN_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.speedrunRun.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `A run with slug "${slug}" already exists` }, { status: 409 });
  }

  const run = await prisma.$transaction(async (tx) => {
    // If the new run is being marked current, clear isCurrent on all others.
    if (isCurrent === true) {
      await tx.speedrunRun.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const created = await tx.speedrunRun.create({
      data: {
        slug,
        monthLabel,
        theme: theme ?? null,
        themeDescription: themeDescription ?? null,
        status: status ?? "upcoming",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        submissionOpenDate: submissionOpenDate ? new Date(submissionOpenDate) : null,
        irlEventDate: irlEventDate ? new Date(irlEventDate) : null,
        winnersDate: winnersDate ? new Date(winnersDate) : null,
        sponsors: sponsors ?? null,
        prizePool: prizePool ?? null,
        hostCities: Array.isArray(hostCities) ? hostCities.filter((c) => typeof c === "string") : [],
        faq: faq ?? null,
        isCurrent: isCurrent === true,
      },
    });

    // Optional tracks payload — bulk-create.
    if (Array.isArray(tracks) && tracks.length > 0) {
      await tx.speedrunTrack.createMany({
        data: tracks
          .filter((t: { name?: string; tagline?: string }) => t?.name && t?.tagline)
          .map(
            (
              t: {
                name: string;
                tagline: string;
                iconKey?: string;
                description?: string;
                sortOrder?: number;
              },
              i: number
            ) => ({
              runId: created.id,
              name: t.name,
              tagline: t.tagline,
              iconKey: t.iconKey ?? null,
              description: t.description ?? null,
              sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : i,
            })
          ),
      });
    }

    return tx.speedrunRun.findUnique({
      where: { id: created.id },
      include: { tracks: { orderBy: { sortOrder: "asc" } } },
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
  await logAudit({
    action: "CREATE",
    resource: "SPEEDRUN_RUN",
    resourceId: run?.id,
    actorId,
    metadata: { slug: run?.slug, monthLabel: run?.monthLabel, status: run?.status },
  });

  return NextResponse.json({ run }, { status: 201 });
}
