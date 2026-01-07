import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
