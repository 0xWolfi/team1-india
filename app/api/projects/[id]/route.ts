import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// GET /api/projects/[id] — project detail + increment view
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve the project minimally first so we know its owner/team/status.
    const owner = await prisma.userProject.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      select: {
        id: true,
        ownerEmail: true,
        teamEmails: true,
        status: true,
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const callerEmail = session?.user?.email ?? null;
    const callerRole = (session?.user as any)?.role;
    const isCore = callerRole === "CORE";
    const isTeam =
      !!callerEmail &&
      (owner.ownerEmail === callerEmail || owner.teamEmails.includes(callerEmail));
    const isAuthorized = isTeam || isCore;

    // Non-authorized callers may only see published projects.
    if (!isAuthorized && owner.status !== "published") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Public-safe field set. PII (ownerEmail, teamEmails) and the privacy
    // JSON are intentionally excluded for non-authorized callers.
    const publicProject = await prisma.userProject.findUnique({
      where: { id: owner.id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        images: true,
        demoUrl: true,
        repoUrl: true,
        videoUrl: true,
        socialPostUrl: true,
        techStack: true,
        tags: true,
        status: true,
        version: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
        speedrunRunId: true,
        speedrunTrackId: true,
        speedrunTeamId: true,
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!publicProject) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Authorized callers (owner, teammate, CORE) get the sensitive fields too.
    let project: any = publicProject;
    if (isAuthorized) {
      const sensitive = await prisma.userProject.findUnique({
        where: { id: owner.id },
        select: { ownerEmail: true, teamEmails: true, privacy: true },
      });
      project = { ...publicProject, ...sensitive };
    }

    // Increment view count (non-blocking) only after we've confirmed the
    // caller can actually see the project.
    prisma.userProject
      .update({
        where: { id: owner.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json({ project });
  } catch (err) {
    console.error("GET /api/projects/[id] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/projects/[id] — update with optimistic locking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { currentVersion, ...updates } = body;

  const project = await prisma.userProject.findUnique({ where: { id } });
  if (!project || project.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only owner or team member can edit
  const isTeam = project.ownerEmail === session.user.email || project.teamEmails.includes(session.user.email);
  const isCore = (session.user as any)?.role === "CORE";
  if (!isTeam && !isCore) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optimistic locking — reject if version mismatch
  if (currentVersion !== undefined && currentVersion !== project.version) {
    return NextResponse.json({ error: "CONFLICT_EDIT", currentVersion: project.version }, { status: 409 });
  }

  const allowedFields = [
    "title", "description", "coverImage", "images", "demoUrl", "repoUrl",
    "techStack", "tags", "status", "privacy",
  ];

  const data: any = { version: { increment: 1 } };
  for (const field of allowedFields) {
    if (updates[field] !== undefined) data[field] = updates[field];
  }

  // Create version snapshot before updating
  await prisma.projectVersion.create({
    data: {
      projectId: id,
      versionNum: project.version,
      title: project.title,
      description: project.description,
      changes: updates._changeNote || null,
      createdBy: session.user.email,
      snapshot: {
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        tags: project.tags,
        demoUrl: project.demoUrl,
        repoUrl: project.repoUrl,
      },
    },
  });

  const updated = await prisma.userProject.update({ where: { id }, data });

  // Notify other team members
  const otherMembers = project.teamEmails.filter((e) => e !== session.user.email);
  for (const email of otherMembers) {
    sendNotification(
      email,
      "project_edited",
      "Project Updated",
      `${session.user.name || session.user.email} edited "${project.title}"`,
      `/public/projects/${project.slug}`
    ).catch(() => {});
  }

  return NextResponse.json({ project: updated });
}

// DELETE /api/projects/[id] — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.userProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = project.ownerEmail === session.user.email;
  const isCore = (session.user as any)?.role === "CORE";
  if (!isOwner && !isCore) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.userProject.update({
    where: { id },
    data: { deletedAt: new Date(), status: "hidden" },
  });

  return NextResponse.json({ success: true });
}
