import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects/my — own projects (owner or team member)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.userProject.findMany({
    where: {
      deletedAt: null,
      teamEmails: { has: session.user.email },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      status: true,
      likeCount: true,
      viewCount: true,
      commentCount: true,
      ownerEmail: true,
      teamEmails: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ projects });
}
