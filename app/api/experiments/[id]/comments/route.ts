import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { notificationManager } from "@/lib/notificationManager";

const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const json = await request.json();
    const body = commentSchema.parse(json);

    // Check both Member (CORE) and CommunityMember (MEMBER) tables
    let userId: string | null = null;
    let authorEmail: string | null = null;
    let communityMember: any = null;

    // First check Member table (CORE users)
    const coreMember = await prisma.member.findUnique({
        where: { email: session.user?.email! }
    });

    if (coreMember) {
        userId = coreMember.id;
        authorEmail = session.user?.email || null;
    } else {
        // Check CommunityMember table (regular members)
        // @ts-ignore
        communityMember = await prisma.communityMember.findUnique({
            where: { email: session.user?.email! }
        });

        if (communityMember) {
            // For CommunityMembers, we can't use their ID in authorId (foreign key constraint)
            // Store their email instead
            authorEmail = session.user?.email || null;
            userId = null;
        }
    }

    if (!coreMember && !communityMember) {
        return new NextResponse("User not found in system", { status: 404 });
    }

    const comment = await prisma.experimentComment.create({
      data: {
        body: body.body,
        experimentId: id,
        authorId: userId, // null for CommunityMembers, Member ID for Core members
        authorEmail: authorEmail // Email for both, used to fetch CommunityMember data
      },
      include: {
        author: userId ? { select: { name: true, image: true } } : undefined
      }
    });

    // If author is null (CommunityMember), add their info manually
    if (!comment.author && communityMember) {
        // Return response early but continue processing notifications
        NextResponse.json({
            ...comment,
            author: { name: communityMember.name, image: null }
        });
    }

    // Send Notifications (Fire and Forget)
    (async () => {
      try {
        const experiment = await prisma.experiment.findUnique({
             where: { id },
             select: { title: true, createdById: true }
        });

        // 1. Notify Experiment Creator (if it's not the commenter)
        if (experiment?.createdById && experiment.createdById !== userId) {
             const commenterName = coreMember?.name || communityMember?.name || 'Someone';
             
             await notificationManager.send({
                 userId: experiment.createdById,
                 event: 'experiment_comment',
                 title: 'New Comment on Experiment',
                 body: `${commenterName} commented on "${experiment.title}"`,
                 data: {
                     url: `/core/experiments/${id}`,
                     id: comment.id
                 }
             });
        }
      } catch (err) {
         console.error("Failed to send comment notification:", err);
      }
    })();

    if (!comment.author && communityMember) {
         // Already handled response above if community member
         return; // Logic flow adjustment needed or just return standard response if not early return
    }

    return NextResponse.json(comment);
  } catch (error) {
     if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error("[EXPERIMENT_COMMENT_POST_ERROR]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
