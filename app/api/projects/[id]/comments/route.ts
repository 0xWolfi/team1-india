import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";

// GET /api/projects/[id]/comments — list comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const session = await getServerSession(authOptions);
  const isCore = (session?.user as any)?.role === "CORE";

  const where: any = { projectId, deletedAt: null };
  if (!isCore) where.isHidden = false;

  const comments = await prisma.projectComment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ comments });
}

// POST /api/projects/[id]/comments — add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const content = sanitizeText(body.content || "", 2000);

  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const comment = await prisma.projectComment.create({
    data: { projectId, authorEmail: session.user.email, content },
  });

  // Increment comment count
  await prisma.userProject.update({
    where: { id: projectId },
    data: { commentCount: { increment: 1 } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
