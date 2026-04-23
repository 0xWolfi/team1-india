import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id]/registrations — admin view (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const registrations = await prisma.challengeRegistration.findMany({
    where: { challengeId: id },
    include: { teamMembers: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ registrations });
}
