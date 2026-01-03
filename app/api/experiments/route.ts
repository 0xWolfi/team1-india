import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import * as z from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    const where: any = {
      deletedAt: null,
    };

    if (stage) {
      where.stage = stage;
    }

    const experiments = await prisma.experiment.findMany({
      where,
      include: {
        createdBy: {
          // @ts-ignore
          select: { name: true, image: true, email: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(experiments);
  } catch (error) {
    console.error("[EXPERIMENTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const json = await request.json();
    const body = createSchema.parse(json);

    // Get user from DB to verify
    const user = await prisma.member.findUnique({
        where: { email: session.user?.email! }
    });
    
    if (!user) return new NextResponse("User not found", { status: 404 });

    const experiment = await prisma.experiment.create({
      data: {
        title: body.title,
        description: body.description,
        stage: "PROPOSED",
        createdById: user.id,
      },
    });

    await logAudit({
        action: 'CREATE',
        resource: 'EXPERIMENT',
        resourceId: experiment.id,
        actorId: user.id,
        metadata: { title: body.title }
    });

    return NextResponse.json(experiment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse(null, { status: 500 });
  }
}
