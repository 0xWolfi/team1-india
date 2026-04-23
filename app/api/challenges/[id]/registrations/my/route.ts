import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id]/registrations/my — own registration
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const registration = await prisma.challengeRegistration.findUnique({
    where: { challengeId_captainEmail: { challengeId: id, captainEmail: session.user.email } },
    include: { teamMembers: true },
  });
  return NextResponse.json({ registration });
}
