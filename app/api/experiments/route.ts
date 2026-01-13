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

    // For experiments created by CommunityMembers (createdBy is null), fetch their data
    const experimentsWithCreators = await Promise.all(
      experiments.map(async (exp) => {
        if (!exp.createdBy && exp.createdByEmail) {
          // @ts-ignore
          const communityMember = await prisma.communityMember.findUnique({
            where: { email: exp.createdByEmail },
            select: { name: true, email: true }
          });
          
          if (communityMember) {
            return {
              ...exp,
              createdBy: {
                name: communityMember.name,
                image: null,
                email: communityMember.email
              }
            };
          }
        }
        return exp;
      })
    );

    return NextResponse.json(experimentsWithCreators);
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

    // Check both Member (CORE) and CommunityMember (MEMBER) tables
    let userId: string | null = null;
    let creatorEmail: string | null = null;

    // First check Member table (CORE users)
    const coreMember = await prisma.member.findUnique({
        where: { email: session.user?.email! }
    });

    if (coreMember) {
        userId = coreMember.id;
        creatorEmail = session.user?.email || null;
    } else {
        // Check CommunityMember table (regular members)
        // @ts-ignore
        const communityMember = await prisma.communityMember.findUnique({
            where: { email: session.user?.email! }
        });

        if (communityMember) {
            // For CommunityMembers, we can't use their ID in createdById (foreign key constraint)
            // Store their email instead in createdByEmail field
            creatorEmail = session.user?.email || null;
            userId = null; // Set to null to avoid foreign key constraint violation
        }
    }

    if (!userId && !creatorEmail) {
        return new NextResponse("User not found in system", { status: 404 });
    }

    const experiment = await prisma.experiment.create({
      data: {
        title: body.title,
        description: body.description,
        stage: "PROPOSED",
        createdById: userId, // Member ID for Core members, null for CommunityMembers
        createdByEmail: creatorEmail, // Email for both, used to fetch CommunityMember data
      },
    });

    // Only log audit if we have a userId (Core members)
    // For CommunityMembers, we skip audit log since actorId must be a Member ID
    if (userId) {
        await logAudit({
            action: 'CREATE',
            resource: 'EXPERIMENT',
            resourceId: experiment.id,
            actorId: userId,
            metadata: { title: body.title }
        });
    }

    return NextResponse.json(experiment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error("[EXPERIMENTS_POST_ERROR]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
