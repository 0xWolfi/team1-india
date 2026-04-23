import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/challenges/[id]/winners/[wid] — update winner (CORE)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; wid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { wid } = await params;
  const body = await request.json();
  const allowed = ["position", "prizeAmount", "xpAwarded", "pointsAwarded", "trackId"];
  const data: any = {};
  for (const f of allowed) { if (body[f] !== undefined) data[f] = body[f]; }
  const winner = await prisma.challengeWinner.update({ where: { id: wid }, data });
  return NextResponse.json({ winner });
}

// DELETE /api/challenges/[id]/winners/[wid] — remove winner (CORE)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; wid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { wid } = await params;
  await prisma.challengeWinner.delete({ where: { id: wid } });
  return NextResponse.json({ success: true });
}
