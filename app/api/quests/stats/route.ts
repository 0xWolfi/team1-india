import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/quests/stats — quest stats for dashboard
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any)?.role;

  // Active quests available to this user
  const audienceFilter =
    role === "CORE"
      ? {}
      : role === "MEMBER"
      ? { audience: { in: ["all", "member", "public"] } }
      : { audience: { in: ["all", "public"] } };

  const [availableQuests, myCompletions, pendingReview] = await Promise.all([
    prisma.quest.count({
      where: { status: "active", deletedAt: null, ...audienceFilter },
    }),
    prisma.questCompletion.count({
      where: { userEmail: session.user.email, status: "approved" },
    }),
    // Only for CORE: pending reviews
    role === "CORE"
      ? prisma.questCompletion.count({ where: { status: "pending" } })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    availableQuests,
    completedQuests: myCompletions,
    pendingReview,
  });
}
