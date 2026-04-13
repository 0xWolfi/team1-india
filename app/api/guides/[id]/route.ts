import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // CRITICAL SECURITY FIX: Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // @ts-ignore
    const role = session.user.role;

    const guide = await prisma.guide.findUnique({
      where: { id },
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
      }
    });

    if (!guide || guide.deletedAt) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // Security: Check visibility based on user role
    if (role === 'MEMBER' && guide.visibility !== 'MEMBER' && guide.visibility !== 'PUBLIC') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = guide.body as any;
    const normalizedCoverImage =
      guide.coverImage || body?.coverImage || body?.customFields?.coverImage || null;

    return NextResponse.json({
      ...guide,
      coverImage: normalizedCoverImage,
    });
  } catch (error) {
    console.error("Failed to fetch guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== 'CORE') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Basic validation (can use Zod again if shared, tailored here for update)
    // Update whatever is passed.
    const { title, audience, body: guideBody, formSchema, visibility, coverImage } = body;

    const updatedGuide = await prisma.guide.update({
      where: { id },
      data: {
        title,
        coverImage,
        audience: audience,
        visibility: visibility,
        body: guideBody as any,
        formSchema: formSchema as any,
        updatedAt: new Date()
      } as any
    });

    return NextResponse.json(updatedGuide);
  } catch (error) {
    console.error("Failed to update guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== 'CORE') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.guide.update({
      where: { id },
      data: {
        deletedAt: new Date()
      } as any
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete guide:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
