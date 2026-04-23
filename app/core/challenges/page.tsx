"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { Trophy, Plus, Users, FileText } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = { draft: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500", registration_open: "bg-green-500/10 text-green-500", in_progress: "bg-blue-500/10 text-blue-500", judging: "bg-yellow-500/10 text-yellow-500", completed: "bg-purple-500/10 text-purple-500", cancelled: "bg-red-500/10 text-red-500" };

export default function CoreChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  useEffect(() => { fetch("/api/challenges").then((r) => r.json()).then((d) => setChallenges(d.challenges || [])); }, []);

  return (
    <CoreWrapper>
      <CorePageHeader title="Challenges" description="Manage hackathons and challenges." icon={<Trophy />}>
        <Link href="/core/challenges/new" className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"><Plus className="w-4 h-4" />New Challenge</Link>
      </CorePageHeader>

      <div className="space-y-3">
        {challenges.map((c: any) => (
          <Link key={c.id} href={`/core/challenges/${c.id}`} className="flex items-center justify-between p-4 rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors">
            <div>
              <h3 className="font-bold">{c.title}</h3>
              <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c._count?.registrations || 0} teams</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{c._count?.submissions || 0} submissions</span>
                <span>{c.tracks?.length || 0} tracks</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[c.status] || ""}`}>{c.status?.replace(/_/g, " ")}</span>
          </Link>
        ))}
        {challenges.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No challenges yet.</p>}
      </div>
    </CoreWrapper>
  );
}
