import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects — list published projects
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") || "recent"; // recent, popular, trending

  const where: any = { status: "published", deletedAt: null };
  if (tag) where.tags = { has: tag };

  const orderBy: any =
    sort === "popular"
      ? { likeCount: "desc" }
      : sort === "trending"
      ? { viewCount: "desc" }
      : { createdAt: "desc" };

  const projects = await prisma.userProject.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      techStack: true,
      tags: true,
      ownerEmail: true,
      teamEmails: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
    },
  });

  const hasMore = projects.length > limit;
  if (hasMore) projects.pop();

  return NextResponse.json({
    projects,
    nextCursor: hasMore ? projects[projects.length - 1]?.id : null,
  });
}

// POST /api/projects — create project
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, coverImage, images, demoUrl, repoUrl, techStack, tags, teamEmails, status } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // Generate slug from title
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = await prisma.userProject.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const allTeamEmails = teamEmails?.length
    ? [session.user.email, ...teamEmails.filter((e: string) => e !== session.user.email)]
    : [session.user.email];

  const project = await prisma.userProject.create({
    data: {
      title,
      slug,
      description,
      coverImage,
      images,
      demoUrl,
      repoUrl,
      techStack: techStack ?? [],
      tags: tags ?? [],
      teamEmails: allTeamEmails,
      ownerEmail: session.user.email,
      status: status ?? "published",
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
