import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/profile/[userId]/projects — other user's public projects
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  // userId can be email or user ID — find by teamEmails containing email
  const projects = await prisma.userProject.findMany({
    where: {
      deletedAt: null,
      status: "published",
      teamEmails: { has: userId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      techStack: true,
      tags: true,
      likeCount: true,
      viewCount: true,
      isWinner: true,
      winnerBadge: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ projects });
}
