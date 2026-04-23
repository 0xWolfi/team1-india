import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/challenges/[id]/tracks/[tid]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tid } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.prizeAmount !== undefined) data.prizeAmount = body.prizeAmount;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  const track = await prisma.challengeTrack.update({ where: { id: tid }, data });
  return NextResponse.json({ track });
}

// DELETE /api/challenges/[id]/tracks/[tid]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tid } = await params;
  await prisma.challengeTrack.delete({ where: { id: tid } });
  return NextResponse.json({ success: true });
}
