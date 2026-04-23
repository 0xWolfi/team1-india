import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/quests/my — user's quest completions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const completions = await prisma.questCompletion.findMany({
    where: { userEmail: session.user.email },
    include: {
      quest: {
        select: {
          id: true,
          title: true,
          type: true,
          category: true,
          xpReward: true,
          pointsReward: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ completions });
}
