import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { unstable_cache } from "next/cache";

export const revalidate = 600;

const getCachedPublicMembers = unstable_cache(
  async () => {
    // Fetch core team members with xHandle
    const coreMembers = await prisma.member.findMany({
      where: {
        status: "active",
        deletedAt: null,
        xHandle: { not: null },
      },
      select: {
        name: true,
        xHandle: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch community members with xHandle
    const communityMembers = await prisma.communityMember.findMany({
      where: {
        status: "active",
        deletedAt: null,
        xHandle: { not: null },
      },
      select: {
        name: true,
        xHandle: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Combine and deduplicate by xHandle
    const seen = new Set<string>();
    const allMembers: { name: string | null; xHandle: string }[] = [];

    for (const m of [...coreMembers, ...communityMembers]) {
      if (!m.xHandle) continue;
      const handle = m.xHandle.toLowerCase().trim();
      if (seen.has(handle)) continue;
      seen.add(handle);
      allMembers.push({ name: m.name, xHandle: m.xHandle });
    }

    return allMembers;
  },
  ["public-members-showcase"],
  { revalidate: 600 }
);

export async function GET(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(30, 60 * 1000)(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const members = await getCachedPublicMembers();

    return NextResponse.json(
      { members, count: members.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
          "CDN-Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("[API] GET /api/public/members Failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
