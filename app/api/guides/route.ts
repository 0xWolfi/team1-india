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

    const where = type ? { type: type.toUpperCase() } : {};

    const guides = await prisma.guide.findMany({
      where: {
        ...where,
        deletedAt: null
      } as any,
      orderBy: { createdAt: "desc" }
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

    // Optional: Add Admin check here if needed

    const body = await req.json();
    const result = CreateGuideSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid Request", details: result.error.format() }, { status: 400 });
    }

    const { type, title, video, coverImage, body: guideBody, formSchema, audience } = result.data as any;

    const guide = await prisma.guide.create({
      data: {
        type,
        title,
        coverImage,
        audience: audience || [],
        body: guideBody as any, // Prisma Json type workaround
        formSchema: formSchema as any
      } as any
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error("Failed to create guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
