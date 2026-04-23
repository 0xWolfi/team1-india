import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/[id]/comments/[cid] — owner hide comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, cid } = await params;

  // Only project owner can hide
  const project = await prisma.userProject.findUnique({
    where: { id: projectId },
    select: { ownerEmail: true },
  });

  if (!project || project.ownerEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  await prisma.projectComment.update({
    where: { id: cid },
    data: { isHidden: body.isHidden ?? true },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/projects/[id]/comments/[cid] — admin delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { cid, id: projectId } = await params;

  await prisma.projectComment.update({
    where: { id: cid },
    data: { deletedAt: new Date() },
  });

  await prisma.userProject.update({
    where: { id: projectId },
    data: { commentCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
