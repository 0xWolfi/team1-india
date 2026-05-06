import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/[id]/comments/[cid] — owner hide comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
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

    let body: { isHidden?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // empty/invalid body — fall through with defaults
    }

    // IDOR fix: scope update by both comment id AND projectId so an owner of
    // project A cannot hide comments belonging to project B.
    const result = await prisma.projectComment.updateMany({
      where: { id: cid, projectId },
      data: { isHidden: body.isHidden ?? true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/projects/[id]/comments/[cid] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/comments/[cid] — admin delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { cid, id: projectId } = await params;

    // Only soft-delete and decrement commentCount when the comment actually
    // belongs to the path project — prevents stray decrements on the wrong row.
    const result = await prisma.projectComment.updateMany({
      where: { id: cid, projectId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.userProject.update({
      where: { id: projectId },
      data: { commentCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/projects/[id]/comments/[cid] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
