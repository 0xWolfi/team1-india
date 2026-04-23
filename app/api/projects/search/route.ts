import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/search?q=keyword — search projects
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ projects: [] });
  }

  const projects = await prisma.userProject.findMany({
    where: {
      deletedAt: null,
      status: "published",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
        { techStack: { has: q } },
      ],
    },
    orderBy: { likeCount: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      techStack: true,
      tags: true,
      likeCount: true,
      isWinner: true,
      winnerBadge: true,
    },
  });

  return NextResponse.json({ projects });
}
