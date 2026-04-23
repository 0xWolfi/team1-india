"use client";

import { useEffect, useState } from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ClipboardList, CheckCircle, XCircle } from "lucide-react";

export default function CoreReviewQueuePage() {
  const [questPending, setQuestPending] = useState<any[]>([]);
  const [bountyPending, setBountyPending] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/quests/stats").then((r) => r.json()).then((d) => {
      if (d.pendingReview > 0) {
        // Fetch actual pending items — simplified, fetches from first active quest
        fetch("/api/bounty/submissions").then((r) => r.json()).then((subs) => {
          const pending = Array.isArray(subs) ? subs.filter((s: any) => s.status === "pending") : [];
          setBountyPending(pending.slice(0, 20));
        });
      }
    });
  }, []);

  const handleReview = async (id: string, status: "approved" | "rejected", type: "quest" | "bounty") => {
    const url = type === "quest" ? `/api/quests/completions/${id}` : `/api/bounty/submissions/${id}`;
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (type === "bounty") setBountyPending((p) => p.filter((s) => s.id !== id));
    else setQuestPending((p) => p.filter((s) => s.id !== id));
  };

  const allPending = [...bountyPending];

  return (
    <CoreWrapper>
      <CorePageHeader title="Review Queue" description="Pending quest and bounty submissions." icon={<ClipboardList />} />

      <div className="space-y-3">
        {allPending.map((s: any) => (
          <div key={s.id} className="p-4 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{s.bounty?.title || "Submission"}</h3>
              <div className="text-xs text-zinc-400 mt-1">by {s.submittedByEmail || s.submittedBy?.email || "unknown"} &middot; {new Date(s.submittedAt).toLocaleDateString()}</div>
              {s.proofUrl && <a href={s.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block truncate">{s.proofUrl}</a>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleReview(s.id, "approved", "bounty")} className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors"><CheckCircle className="w-4 h-4" /></button>
              <button onClick={() => handleReview(s.id, "rejected", "bounty")} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {allPending.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No pending reviews. All caught up!</p>}
      </div>
    </CoreWrapper>
  );
}
