"use client";

import { useEffect, useState } from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Zap, Plus, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function CoreQuestsPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    fetch("/api/quests?status=active").then((r) => r.json()).then((d) => setQuests(d.quests || []));
    fetch("/api/quests/stats").then((r) => r.json()).then((d) => setPending(d.pendingReview || 0));
  }, []);

  return (
    <CoreWrapper>
      <CorePageHeader title="Quests" description={`${quests.length} active quests · ${pending} pending reviews`} icon={<Zap />}>
        <Link href="/core/quests/new" className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 flex items-center gap-2"><Plus className="w-4 h-4" />New Quest</Link>
      </CorePageHeader>

      <div className="space-y-3">
        {quests.map((q: any) => (
          <div key={q.id} className="p-4 rounded-xl border border-black/5 dark:border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">{q.title}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span className="text-purple-500">+{q.xpReward} XP</span>
                  <span className="text-yellow-500">+{q.pointsReward} pts</span>
                  <span>{q.type}</span>
                  <span>{q.audience}</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />{q.totalCompletions} done</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${q.status === "active" ? "bg-green-500/10 text-green-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>{q.status}</span>
            </div>
          </div>
        ))}
        {quests.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No quests yet.</p>}
      </div>
    </CoreWrapper>
  );
}
