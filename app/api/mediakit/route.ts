import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import * as z from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().refine((val) => ["BRAND_ASSET", "COLOR_PALETTE", "BIO", "FILE"].includes(val), {
    message: "Invalid type. Must be BRAND_ASSET, COLOR_PALETTE, BIO, or FILE"
  }),
  content: z.string().optional(), // URL for files/images, or Hex code for colors
  customFields: z.record(z.string(), z.any()).optional(), // Store metadata like format, dimensions, bio text
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");

    const where: any = {
      deletedAt: null,
      type: {
        in: ["BRAND_ASSET", "COLOR_PALETTE", "BIO", "FILE"]
      }
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    // @ts-ignore
    const resources = await prisma.contentResource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, image: true }
        }
      }
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("[MEDIAKIT_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await request.json();
    const body = createSchema.parse(json);

    // Get user
    const user = await prisma.member.findUnique({
        where: { email: session.user?.email! }
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // @ts-ignore
    const resource = await prisma.contentResource.create({
      data: {
        title: body.title,
        type: body.type,
        content: body.content,
        customFields: body.customFields || {},
        createdById: user.id,
        status: "published" // Default to published for media kit
      }
    });

    // Log the activity
    await logAudit({
        action: 'CREATE',
        resource: 'MEDIA_KIT',
        resourceId: resource.id,
        actorId: user.id,
        metadata: { title: body.title, type: body.type }
    });

    return NextResponse.json(resource);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 400 });
    }
    console.error("[MEDIAKIT_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
