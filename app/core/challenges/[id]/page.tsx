"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Trophy, Users, FileText, Award, Download } from "lucide-react";
import Link from "next/link";

export default function CoreChallengeDetailPage() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState<any>(null);

  useEffect(() => { fetch(`/api/challenges/${id}`).then((r) => r.json()).then((d) => setChallenge(d.challenge)); }, [id]);

  if (!challenge) return <CoreWrapper><div className="text-zinc-400 text-center py-20">Loading...</div></CoreWrapper>;

  return (
    <CoreWrapper>
      <CorePageHeader title={challenge.title} description={`Status: ${challenge.status} | ${challenge._count?.registrations || 0} teams | ${challenge._count?.submissions || 0} submissions`} icon={<Trophy />} backLink="/core/challenges" backText="Back to Challenges" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Registrations", value: challenge._count?.registrations || 0, icon: Users },
          { label: "Submissions", value: challenge._count?.submissions || 0, icon: FileText },
          { label: "Winners", value: challenge._count?.winners || 0, icon: Award },
          { label: "Tracks", value: challenge.tracks?.length || 0, icon: Trophy },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
            <s.icon className="w-5 h-5 text-zinc-400 mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Registrations", href: `/api/challenges/${id}/export/registrations`, icon: Users },
          { label: "Submissions", href: `/api/challenges/${id}/export/submissions`, icon: FileText },
        ].map((exp) => (
          <a key={exp.label} href={exp.href} download className="flex items-center gap-3 p-4 rounded-xl border border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            <Download className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-medium">Export {exp.label} (CSV)</span>
          </a>
        ))}
      </div>

      {challenge.tracks?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Tracks</h2>
          <div className="space-y-2">
            {challenge.tracks.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl border border-black/5 dark:border-white/5 flex justify-between items-center">
                <span className="font-medium text-sm">{t.name}</span>
                {t.prizeAmount && <span className="text-xs text-zinc-400">{t.prizeAmount}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </CoreWrapper>
  );
}
