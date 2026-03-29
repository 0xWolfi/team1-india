import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as z from "zod";

// Validator for creating a guide
const CreateGuideSchema = z.object({
  type: z.enum(["EVENT", "PROGRAM", "CONTENT", "WORKSHOP", "HACKATHON", "EVENT_FEEDBACK"]),
  title: z.string().min(1, "Title is required"),
  coverImage: z.string().optional(),
  visibility: z.enum(["CORE", "MEMBER", "PUBLIC"]).optional().default("CORE"),
  audience: z.array(z.string()).optional(),
  body: z.object({
    description: z.string().optional(),
    markdown: z.string().optional(),
    // Legacy fields kept for backward compatibility
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
  // CRITICAL SECURITY FIX: Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const visibility = searchParams.get("visibility");

    // @ts-ignore
    const role = session.user.role;

    const where: any = { deletedAt: null };
    if (type) where.type = type.toUpperCase();
    
    // Security: Filter by visibility based on user role
    if (visibility) {
      where.visibility = visibility.toUpperCase();
    } else {
      // If no visibility specified, filter based on role
      if (role === 'MEMBER') {
        where.visibility = { in: ['MEMBER', 'PUBLIC'] };
      }
      // CORE can see all (no additional filter)
    }

    const guides = await prisma.guide.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        coverImage: true,
        body: true,
        audience: true,
        formSchema: true,
        visibility: true,
        maxSubmissionsPublic: true,
        maxSubmissionsMember: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        createdById: true,
        createdBy: { select: { email: true, id: true, name: true } }
      }
    });

    const normalizedGuides = guides.map((guide) => {
      const body = guide.body as any;
      const normalizedCoverImage =
        guide.coverImage || body?.coverImage || body?.customFields?.coverImage || null;

      return {
        ...guide,
        coverImage: normalizedCoverImage,
      };
    });

    return NextResponse.json(normalizedGuides);
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
    const typeMap: Record<string, string> = { event: 'events', program: 'programs', content: 'content', workshop: 'events', hackathon: 'events' };
    const guideType = typeMap[result.data.type.toLowerCase()] || result.data.type.toLowerCase();
    
    // @ts-ignore
    const { hasPermission } = await import("@/lib/permissions"); // Dynamic import to avoid circular dep if any, or just import at top
    
    if (!hasPermission(userPermissions, guideType, "WRITE")) {
         return NextResponse.json({ error: "Forbidden: Insufficient Write Access" }, { status: 403 });
    }

    const member = await prisma.member.findUnique({
        where: { email: session.user.email }
    });

    const { type, title, coverImage, body: guideBody, formSchema, audience, visibility, maxSubmissionsPublic, maxSubmissionsMember } = result.data as any;

    // Generate slug for WORKSHOP/HACKATHON/EVENT_FEEDBACK from city or title
    let slug: string | undefined;
    if (type === 'WORKSHOP' || type === 'HACKATHON' || type === 'EVENT_FEEDBACK') {
      const source = (guideBody as any)?.city || title || '';
      if (source) {
        const baseSlug = source
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        // Check for uniqueness
        const existing = await prisma.guide.findUnique({ where: { slug: baseSlug } });
        slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
      }
    }

    const guide = await prisma.guide.create({
      data: {
        type,
        title,
        coverImage,
        visibility,
        slug,
        audience: audience || [],
        body: guideBody as any,
        formSchema: formSchema as any,
        maxSubmissionsPublic,
        maxSubmissionsMember,
        createdById: member?.id
      } as any
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error("Failed to create guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
