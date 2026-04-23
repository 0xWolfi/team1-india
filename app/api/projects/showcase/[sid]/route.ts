import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/showcase/[sid] — update section (CORE)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ sid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sid } = await params;
  const body = await request.json();
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.projectIds !== undefined) data.projectIds = body.projectIds;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  const section = await prisma.showcaseSection.update({ where: { id: sid }, data });
  return NextResponse.json({ section });
}

// DELETE /api/projects/showcase/[sid] — delete section (CORE)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ sid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sid } = await params;
  await prisma.showcaseSection.delete({ where: { id: sid } });
  return NextResponse.json({ success: true });
}
