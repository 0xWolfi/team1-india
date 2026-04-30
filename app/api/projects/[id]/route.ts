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
  const { id } = await params;

  // Try by ID first, then by slug
  const project = await prisma.userProject.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null },
    include: {
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment view count (non-blocking)
  prisma.userProject.update({
    where: { id: project.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.json({ project });
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
