import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as z from "zod";

// Validator for creating a guide
const CreateGuideSchema = z.object({
  type: z.enum(["EVENT", "PROGRAM", "CONTENT"]),
  title: z.string().min(1, "Title is required"),
  coverImage: z.string().optional(),
  visibility: z.enum(["CORE", "MEMBER", "PUBLIC"]).optional().default("CORE"),
  audience: z.array(z.string()).optional(),
  body: z.object({
    description: z.string().optional(),
    kpis: z.array(z.object({
        label: z.string(),
        value: z.string(),
        color: z.string().optional()
    })).optional(),
    timeline: z.array(z.object({
        step: z.string(),
        duration: z.string()
    })).optional(),
    rules: z.array(z.string()).optional()
  }),
  formSchema: z.any().optional() // Flexible: can be array (rich) or object (legacy)
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const visibility = searchParams.get("visibility");

    const where: any = { deletedAt: null };
    if (type) where.type = type.toUpperCase();
    if (visibility) where.visibility = visibility.toUpperCase();

    const guides = await prisma.guide.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { createdBy: true }
    });

    return NextResponse.json(guides);
  } catch (error) {
    console.error("Failed to fetch guides:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = CreateGuideSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid Request", details: result.error.format() }, { status: 400 });
    }

    // Permission Check
    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const guideType = result.data.type.toLowerCase(); // event, program, content

    // Special case for 'playbook' if we ever support it via this route, though schema restricts enum.
    // If enum is EVENT, PROGRAM, CONTENT, these map to resource keys 'event', 'program', 'content'.
    
    // @ts-ignore
    const { hasPermission } = await import("@/lib/permissions"); // Dynamic import to avoid circular dep if any, or just import at top
    
    if (!hasPermission(userPermissions, guideType, "WRITE")) {
         return NextResponse.json({ error: "Forbidden: Insufficient Write Access" }, { status: 403 });
    }

    const member = await prisma.member.findUnique({
        where: { email: session.user.email }
    });

    const { type, title, video, coverImage, body: guideBody, formSchema, audience, visibility } = result.data as any;

    const guide = await prisma.guide.create({
      data: {
        type,
        title,
        coverImage,
        visibility,
        audience: audience || [],
        body: guideBody as any, // Prisma Json type workaround
        formSchema: formSchema as any,
        createdById: member?.id
      } as any
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error("Failed to create guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
