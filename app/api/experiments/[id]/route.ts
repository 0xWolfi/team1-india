import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail, getApprovalEmailTemplate, getRejectionEmailTemplate, getDiscussionEmailTemplate } from "@/lib/email";
import * as z from "zod";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  stage: z.enum(["PROPOSED", "DISCUSSION", "APPROVED", "REJECTED"]).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      createdBy: {
        // @ts-ignore
        select: { name: true, image: true, email: true },
      },
      comments: {
        include: {
            author: { select: { name: true, image: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
  });

  if (!experiment) return new NextResponse("Not found", { status: 404 });

  // If createdBy is null but createdByEmail exists, fetch CommunityMember data
  let experimentWithCreator = experiment;
  if (!experiment.createdBy && experiment.createdByEmail) {
    // @ts-ignore
    const communityMember = await prisma.communityMember.findUnique({
      where: { email: experiment.createdByEmail },
      select: { name: true, email: true }
    });
    
    if (communityMember) {
      experimentWithCreator = {
        ...experiment,
        createdBy: {
          name: communityMember.name,
          image: null,
          email: communityMember.email
        }
      };
    }
  }

  // For comments with null author (CommunityMembers), fetch their data using authorEmail
  const commentsWithAuthors = await Promise.all(
    experimentWithCreator.comments.map(async (comment: any) => {
      if (!comment.author && comment.authorEmail) {
        // @ts-ignore
        const communityMember = await prisma.communityMember.findUnique({
          where: { email: comment.authorEmail },
          select: { name: true, email: true }
        });
        
        if (communityMember) {
          return {
            ...comment,
            author: {
              name: communityMember.name,
              image: null
            }
          };
        }
      }
      return comment;
    })
  );

  return NextResponse.json({
    ...experimentWithCreator,
    comments: commentsWithAuthors
  });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userPermissions = (session.user as any)?.permissions || {};
  const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

  try {
    const json = await request.json();
    const body = updateSchema.parse(json);

    // Permission Check for Stage Change
    if (body.stage) {
        if (['APPROVED', 'REJECTED', 'DISCUSSION'].includes(body.stage)) {
            if (!isSuperAdmin) return new NextResponse("Only Superadmins can change proposal status", { status: 403 });
        }
    }

    const experiment = await prisma.experiment.update({
      where: { id },
      data: body,
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });

    await logAudit({
        action: 'UPDATE',
        resource: 'EXPERIMENT',
        resourceId: experiment.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actorId: (session.user as any).id,
        metadata: body
    });

    // Send email notifications when status changes
    if (body.stage) {
      // Get creator email - either from createdBy relation or createdByEmail field
      let creatorEmail = experiment.createdBy?.email || (experiment as any).createdByEmail;
      let creatorName = experiment.createdBy?.name || 'Member';
      
      // If createdBy is null but createdByEmail exists, fetch CommunityMember data
      if (!experiment.createdBy && (experiment as any).createdByEmail) {
        // @ts-ignore
        const communityMember = await prisma.communityMember.findUnique({
          where: { email: (experiment as any).createdByEmail },
          select: { name: true, email: true }
        });
        
        if (communityMember) {
          creatorEmail = communityMember.email;
          creatorName = communityMember.name || 'Member';
        }
      }
      
      const proposalTitle = experiment.title || 'Your Proposal';

      if (creatorEmail) {
        if (body.stage === 'APPROVED') {
          await sendEmail({
            to: creatorEmail,
            subject: `Proposal Approved: ${proposalTitle}`,
            html: getApprovalEmailTemplate(
              creatorName,
              proposalTitle,
              'Your proposal has been approved by the governance committee and will move to implementation planning.'
            )
          });
        } else if (body.stage === 'REJECTED') {
          await sendEmail({
            to: creatorEmail,
            subject: `Proposal Status Update: ${proposalTitle}`,
            html: getRejectionEmailTemplate(
              creatorName,
              proposalTitle,
              'After careful consideration, the governance committee has decided not to proceed with this proposal at this time.'
            )
          });
        } else if (body.stage === 'DISCUSSION') {
          // Send notification that proposal is now open for community discussion
          await sendEmail({
            to: creatorEmail,
            subject: `Proposal Moved to Discussion: ${proposalTitle}`,
            html: getDiscussionEmailTemplate(creatorName, proposalTitle)
          });
        }
      }
    }

    return NextResponse.json(experiment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userPermissions = (session.user as any)?.permissions || {};
  const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';
  
  if (!isSuperAdmin) return new NextResponse("Forbidden", { status: 403 });

  await prisma.experiment.update({
    where: { id },
    // @ts-ignore
    data: { deletedAt: new Date() }
  });

  await logAudit({
      action: 'DELETE',
      resource: 'EXPERIMENT',
      resourceId: id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actorId: (session.user as any).id,
  });

  return NextResponse.json({ success: true });
}
