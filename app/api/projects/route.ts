import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { canSubmitForRun } from "@/lib/speedrun";

// GET /api/projects — list published projects
//
// Query params:
//   ?tag=xxx        — filter by tag (existing)
//   ?sort=...       — recent | popular | trending (existing)
//   ?speedrun=1     — only Speedrun submissions (any run)
//   ?speedrunRun=slug — only submissions from a specific run slug
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") || "recent"; // recent, popular, trending
  const speedrunOnly = searchParams.get("speedrun") === "1";
  const speedrunRunSlug = searchParams.get("speedrunRun");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: "published", deletedAt: null };
  if (tag) where.tags = { has: tag };
  if (speedrunRunSlug) {
    // Resolve slug → id once. Falls back to "no results" if slug is unknown.
    const run = await prisma.speedrunRun.findFirst({
      where: { slug: speedrunRunSlug, deletedAt: null },
      select: { id: true },
    });
    where.speedrunRunId = run?.id ?? "__none__";
  } else if (speedrunOnly) {
    where.speedrunRunId = { not: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any =
    sort === "popular"
      ? { likeCount: "desc" }
      : sort === "trending"
      ? { viewCount: "desc" }
      : { createdAt: "desc" };

  const projects = await prisma.userProject.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      techStack: true,
      tags: true,
      ownerEmail: true,
      teamEmails: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
      speedrunRun: { select: { slug: true, monthLabel: true } },
      speedrunTrack: { select: { name: true } },
      speedrunTeam: { select: { code: true } },
    },
  });

  const hasMore = projects.length > limit;
  if (hasMore) projects.pop();

  return NextResponse.json({
    projects,
    nextCursor: hasMore ? projects[projects.length - 1]?.id : null,
  });
}

// POST /api/projects — create project
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    coverImage,
    images,
    demoUrl,
    repoUrl,
    videoUrl,
    socialPostUrl,
    techStack,
    tags,
    teamEmails,
    status,
    speedrunRunId,
    speedrunTrackId,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // Generate slug from title
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = await prisma.userProject.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  // Speedrun submission: validate the user is registered for the run and the
  // track (if given) belongs to that run. Defense against arbitrary FK injection.
  // Also pull the caller's team for this run so we can populate speedrunTeamId.
  let resolvedRunId: string | null = null;
  let resolvedTrackId: string | null = null;
  let resolvedTeamId: string | null = null;
  if (speedrunRunId) {
    const run = await prisma.speedrunRun.findUnique({
      where: { id: speedrunRunId },
      select: { id: true, status: true },
    });
    if (!run) {
      return NextResponse.json({ error: "Speedrun run not found" }, { status: 404 });
    }
    // Check the submission window is open. Without this, a user could POST a
    // project to a run that's still in registration_open or has already
    // closed submissions. Edits to existing projects go through PATCH on
    // the project endpoint, which doesn't enforce this gate by design
    // (your decision: edits stay open after close, captured in ProjectVersion).
    if (!canSubmitForRun(run.status)) {
      return NextResponse.json(
        {
          error:
            run.status === "registration_open"
              ? "Submissions are not open yet for this run"
              : "Submissions are closed for this run",
        },
        { status: 409 }
      );
    }
    const myReg = await prisma.speedrunRegistration.findUnique({
      where: { runId_userEmail: { runId: run.id, userEmail: session.user.email } },
      select: { id: true, teamId: true },
    });
    if (!myReg) {
      return NextResponse.json(
        { error: "You must be registered for this Speedrun run to submit" },
        { status: 403 }
      );
    }
    resolvedRunId = run.id;
    resolvedTeamId = myReg.teamId; // null for solo registrants — that's fine

    // One submission per team / per solo-registrant per run. Subsequent edits
    // go through the project's own update flow (which captures versions).
    const dupeWhere = resolvedTeamId
      ? { speedrunRunId: run.id, speedrunTeamId: resolvedTeamId, deletedAt: null }
      : {
          speedrunRunId: run.id,
          ownerEmail: session.user.email,
          speedrunTeamId: null,
          deletedAt: null,
        };
    const existingSubmission = await prisma.userProject.findFirst({
      where: dupeWhere,
      select: { slug: true },
    });
    if (existingSubmission) {
      return NextResponse.json(
        {
          error: "A project for this run already exists. Edit it instead.",
          existingSlug: existingSubmission.slug,
        },
        { status: 409 }
      );
    }

    if (speedrunTrackId) {
      const track = await prisma.speedrunTrack.findUnique({
        where: { id: speedrunTrackId },
        select: { id: true, runId: true },
      });
      if (!track || track.runId !== run.id) {
        return NextResponse.json({ error: "Invalid track for this run" }, { status: 400 });
      }
      resolvedTrackId = track.id;
    }
  }

  const allTeamEmails = teamEmails?.length
    ? [session.user.email, ...teamEmails.filter((e: string) => e !== session.user.email)]
    : [session.user.email];

  // Auto-tag Speedrun submissions so the existing /api/projects?tag= filter
  // surfaces them on the projects page later.
  const allTags: string[] = Array.isArray(tags) ? [...tags] : [];
  if (resolvedRunId) {
    if (!allTags.includes("speedrun")) allTags.push("speedrun");
  }

  const project = await prisma.userProject.create({
    data: {
      title,
      slug,
      description,
      coverImage,
      images,
      demoUrl,
      repoUrl,
      videoUrl: videoUrl ?? null,
      socialPostUrl: socialPostUrl ?? null,
      techStack: techStack ?? [],
      tags: allTags,
      teamEmails: allTeamEmails,
      ownerEmail: session.user.email,
      status: status ?? "published",
      speedrunRunId: resolvedRunId,
      speedrunTrackId: resolvedTrackId,
      speedrunTeamId: resolvedTeamId,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
