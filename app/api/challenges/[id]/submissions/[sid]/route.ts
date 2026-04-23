import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/challenges/[id]/submissions/[sid] — review (CORE)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sid } = await params;
  const { status, reviewNotes } = await request.json();
  const submission = await prisma.challengeSubmission.update({ where: { id: sid }, data: { status, reviewNotes } });
  return NextResponse.json({ submission });
}
