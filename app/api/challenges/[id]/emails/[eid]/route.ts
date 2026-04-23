import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/challenges/[id]/emails/[eid] — edit before send (CORE)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { eid } = await params;
  const existing = await prisma.scheduledEmail.findUnique({ where: { id: eid } });
  if (!existing || existing.status !== "scheduled") return NextResponse.json({ error: "Cannot edit" }, { status: 400 });
  const body = await request.json();
  const data: any = {};
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.body !== undefined) data.body = body.body;
  if (body.scheduledFor !== undefined) data.scheduledFor = new Date(body.scheduledFor);
  if (body.recipientType !== undefined) data.recipientType = body.recipientType;
  const email = await prisma.scheduledEmail.update({ where: { id: eid }, data });
  return NextResponse.json({ email });
}

// DELETE /api/challenges/[id]/emails/[eid] — cancel (CORE)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { eid } = await params;
  await prisma.scheduledEmail.update({ where: { id: eid }, data: { status: "cancelled" } });
  return NextResponse.json({ success: true });
}
