import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects/showcase — curated sections (public)
export async function GET() {
  const sections = await prisma.showcaseSection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch projects for each section
  const result = await Promise.all(
    sections.map(async (section) => {
      const projects = section.projectIds.length > 0
        ? await prisma.userProject.findMany({
            where: { id: { in: section.projectIds }, status: "published", deletedAt: null },
            select: {
              id: true, title: true, slug: true, description: true, coverImage: true,
              techStack: true, likeCount: true, isWinner: true, winnerBadge: true, ownerEmail: true,
            },
          })
        : [];
      return { ...section, projects };
    })
  );

  return NextResponse.json({ sections: result });
}

// POST /api/projects/showcase — create section (CORE)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, description, projectIds, sortOrder } = await request.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const section = await prisma.showcaseSection.create({
    data: { title, description, projectIds: projectIds ?? [], sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json({ section }, { status: 201 });
}
