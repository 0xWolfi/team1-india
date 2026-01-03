import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
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

  return NextResponse.json(experiment);
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
  // Core members have write access to experiments or full access
  const isCore = isSuperAdmin || userPermissions['experiments'] === 'WRITE' || userPermissions['*'] === 'WRITE';

  try {
    const json = await request.json();
    const body = updateSchema.parse(json);

    // Permission Check for Stage Change
    if (body.stage) {
        if (['APPROVED', 'REJECTED'].includes(body.stage)) {
            if (!isSuperAdmin) return new NextResponse("Only Superadmins can approve/reject", { status: 403 });
        }
        if (body.stage === 'DISCUSSION') {
            if (!isCore) return new NextResponse("Only Core members can move to Discussion", { status: 403 });
        }
    }

    const experiment = await prisma.experiment.update({
      where: { id },
      data: body,
    });

    await logAudit({
        action: 'UPDATE',
        resource: 'EXPERIMENT',
        resourceId: experiment.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actorId: (session.user as any).id, 
        metadata: body
    });

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
