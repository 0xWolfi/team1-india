import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/like — toggle like
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const existing = await prisma.projectLike.findUnique({
    where: { projectId_userEmail: { projectId, userEmail: session.user.email } },
  });

  if (existing) {
    // Unlike
    await prisma.projectLike.delete({ where: { id: existing.id } });
    await prisma.userProject.update({
      where: { id: projectId },
      data: { likeCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await prisma.projectLike.create({
      data: { projectId, userEmail: session.user.email },
    });
    await prisma.userProject.update({
      where: { id: projectId },
      data: { likeCount: { increment: 1 } },
    });
    return NextResponse.json({ liked: true });
  }
}
