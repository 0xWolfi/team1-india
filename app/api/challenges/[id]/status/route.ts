import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["registration_open"],
  registration_open: ["in_progress", "cancelled"],
  in_progress: ["judging", "cancelled"],
  judging: ["completed", "in_progress"],
  completed: [],
  cancelled: ["draft"],
};

// PATCH /api/challenges/[id]/status — phase transition (CORE)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { status } = await request.json();

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = VALID_TRANSITIONS[challenge.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${challenge.status} to ${status}` }, { status: 400 });
  }

  const updated = await prisma.challenge.update({ where: { id }, data: { status } });
  return NextResponse.json({ challenge: updated });
}
