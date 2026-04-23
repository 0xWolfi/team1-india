import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// DELETE /api/challenges/[id]/partner-links/[lid] — revoke (CORE)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { lid } = await params;
  await prisma.partnerReviewLink.delete({ where: { id: lid } });
  return NextResponse.json({ success: true });
}
