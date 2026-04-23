import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Zap, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

export default async function MemberQuestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/public?error=login_required");
  const role = (session.user as any)?.role;
  if (role !== "MEMBER" && role !== "CORE") redirect("/public?error=access_denied");

  const [quests, myCompletions] = await Promise.all([
    prisma.quest.findMany({
      where: { status: "active", deletedAt: null, audience: { in: role === "CORE" ? ["all", "member", "public"] : ["all", "member"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.questCompletion.findMany({
      where: { userEmail: session.user.email },
      select: { questId: true, status: true },
    }),
  ]);

  const completionMap = new Map(myCompletions.map((c) => [c.questId, c.status]));

  return (
    <MemberWrapper>
      <CorePageHeader title="Quests" description="Complete quests to earn XP and points." icon={<Zap />} backLink="/member" backText="Back to Dashboard" />

      <div className="space-y-3">
        {quests.map((q) => {
          const status = completionMap.get(q.id);
          return (
            <div key={q.id} className="p-5 rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{q.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500">{q.type}</span>
                    {q.category && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[10px] font-medium text-blue-500">{q.category}</span>}
                  </div>
                  {q.description && <p className="text-zinc-500 text-sm mb-2">{q.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="text-purple-500 font-medium">+{q.xpReward} XP</span>
                    <span className="text-yellow-500 font-medium">+{q.pointsReward} pts</span>
                    {q.endDate && <span>Ends {new Date(q.endDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {status === "approved" ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" />Done</span>
                  ) : status === "pending" ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs font-medium"><Clock className="w-3.5 h-3.5" />Pending</span>
                  ) : status === "rejected" ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium"><XCircle className="w-3.5 h-3.5" />Rejected</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {quests.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No active quests right now. Check back soon!</p>}
      </div>
    </MemberWrapper>
  );
}
