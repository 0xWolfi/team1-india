import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id] — detail
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await prisma.challenge.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null },
    include: {
      tracks: { orderBy: { sortOrder: "asc" } },
      _count: { select: { registrations: true, submissions: true, winners: true } },
    },
  });
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ challenge });
}

// PATCH /api/challenges/[id] — update (CORE)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const allowed = ["title","description","coverImage","body","startDate","endDate","registrationDeadline","submissionDeadline","maxTeamSize","minTeamSize","allowSolo","prizePool","rules","judgingCriteria"];
  const data: any = {};
  for (const f of allowed) {
    if (body[f] !== undefined) {
      data[f] = ["startDate","endDate","registrationDeadline","submissionDeadline"].includes(f) && body[f] ? new Date(body[f]) : body[f];
    }
  }
  const challenge = await prisma.challenge.update({ where: { id }, data });
  return NextResponse.json({ challenge });
}

// DELETE /api/challenges/[id] — soft delete (CORE)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.challenge.update({ where: { id }, data: { deletedAt: new Date(), status: "cancelled" } });
  return NextResponse.json({ success: true });
}
