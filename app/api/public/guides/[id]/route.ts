import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Rate limiting: 20 requests per minute per IP (public endpoint, prevent abuse)
  const rateLimitResponse = await withRateLimit(20, 60 * 1000)(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;

    const guide = await prisma.guide.findUnique({
      where: { 
        id,
        visibility: "PUBLIC",
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!guide) {
      return NextResponse.json({ error: "Guide not found or private" }, { status: 404 });
    }

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Failed to fetch public guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
