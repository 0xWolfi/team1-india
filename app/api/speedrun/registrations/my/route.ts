import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getCurrentRun } from "@/lib/speedrun";

// GET /api/speedrun/registrations/my — current user's status for the current run
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ registered: false, run: null }, { status: 200 });
  }
  const run = await getCurrentRun().catch(() => null);
  if (!run) {
    return NextResponse.json({ registered: false, run: null });
  }

  const reg = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail: session.user.email } },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          code: true,
          captainEmail: true,
          members: { select: { email: true, role: true, joinedAt: true } },
        },
      },
      run: { select: { id: true, slug: true, monthLabel: true, status: true } },
    },
  });

  return NextResponse.json({
    registered: !!reg,
    run: { id: run.id, slug: run.slug, monthLabel: run.monthLabel, status: run.status },
    registration: reg,
  });
}
