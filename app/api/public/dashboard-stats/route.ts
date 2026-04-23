import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";

// GET /api/public/dashboard-stats — aggregated public stats (cached 60s)
export async function GET() {
  const stats = await cached("public-dashboard-stats", 60, async () => {
    const [members, playbooks, bounties, quests, projects, challenges] = await Promise.all([
      prisma.communityMember.count({ where: { status: "active", deletedAt: null } }),
      prisma.playbook.count({ where: { status: "published", deletedAt: null } }),
      prisma.bounty.count({ where: { status: "active", deletedAt: null } }),
      prisma.quest.count({ where: { status: "active", deletedAt: null } }),
      prisma.userProject.count({ where: { status: "published", deletedAt: null } }),
      prisma.challenge.count({ where: { status: { not: "cancelled" }, deletedAt: null } }),
    ]);
    return { members, playbooks, bounties, quests, projects, challenges };
  });

  return NextResponse.json(stats);
}
