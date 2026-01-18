import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // Rate limiting: 30 requests per minute per IP (public endpoint, but prevent abuse)
  const rateLimitResponse = await withRateLimit(30, 60 * 1000)(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const [playbooks, publicGuides, resources] = await Promise.all([
      prisma.playbook.findMany({
        where: { visibility: "PUBLIC", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, title: true, description: true, coverImage: true },
      }),
      prisma.guide.findMany({
        where: {
          visibility: "PUBLIC",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          coverImage: true,
          body: true,
          createdAt: true,
          updatedAt: true,
          visibility: true,
        },
      }),
      // @ts-ignore
      prisma.contentResource.findMany({
        where: {
          type: { in: ["BRAND_ASSET", "FILE", "BIO"] },
          status: "published",
          deletedAt: null,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { 
          id: true, 
          title: true, 
          content: true,
          customFields: true, // We'll filter sensitive data in the mapping below
        },
      }),
    ]);

    // Bucket guides by type (keep same shape as /app/public/page.tsx expects)
    const programs: any[] = [];
    const events: any[] = [];
    const guides: any[] = [];

    publicGuides.forEach((g: any) => {
      const common = {
        id: g.id,
        title: g.title,
        coverImage: g.coverImage,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt || g.createdAt,
        visibility: g.visibility,
        description: g.body?.description || "",
      };

      const type = g.type?.toUpperCase();
      if (type === "PROGRAM") {
        programs.push({
          ...common,
          type: "PROGRAM",
          status: "active",
          body: g.body,
        });
      } else if (type === "EVENT") {
        events.push({
          ...common,
          type: "EVENT",
          status: "planned",
          date: g.body?.date || g.createdAt,
          location: g.body?.location || "",
          body: g.body,
        });
      } else {
        guides.push({
          ...common,
          type: g.type || "CONTENT",
          body: g.body,
        });
      }
    });

    // Filter out sensitive data from customFields before exposing publicly
    const mediaItems = resources.map((res: any) => {
      const safeCustomFields = res.customFields || {};
      // Only include public-safe fields (description, public metadata)
      // Exclude sensitive fields like budget, internal notes, client info, etc.
      const publicFields: any = {};
      if (safeCustomFields.description) {
        publicFields.description = safeCustomFields.description;
      }
      // Add other explicitly safe fields here if needed
      
      return {
        id: res.id,
        title: res.title,
        links: [res.content || "#"],
        description: publicFields.description || "",
      };
    });

    return NextResponse.json(
      { playbooks, programs, guides, events, mediaItems },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("[API] GET /api/public/home Failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

