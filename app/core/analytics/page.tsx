"use client";

import { useEffect, useState } from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { BarChart3, Eye, Users, Smartphone } from "lucide-react";

export default function CoreAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { fetch("/api/analytics/stats?days=30").then((r) => r.json()).then(setStats); }, []);

  return (
    <CoreWrapper>
      <CorePageHeader title="Analytics" description="Page views, visitors, and engagement metrics." icon={<BarChart3 />} />

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Page Views (30d)", value: stats.pageViews?.toLocaleString(), icon: Eye },
              { label: "Unique Visitors", value: stats.uniqueVisitors?.toLocaleString(), icon: Users },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
                <s.icon className="w-5 h-5 text-zinc-400 mb-2" />
                <div className="text-2xl font-bold">{s.value || "0"}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Top Pages</h2>
              <div className="space-y-2">
                {stats.topPages?.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl border border-black/5 dark:border-white/5 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{p.path}</span>
                    <span className="font-medium shrink-0 ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Devices</h2>
              <div className="space-y-2">
                {stats.deviceBreakdown?.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl border border-black/5 dark:border-white/5 text-sm">
                    <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-zinc-400" />{d.device || "unknown"}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {!stats && <p className="text-zinc-400 text-center py-16">Loading analytics...</p>}
    </CoreWrapper>
  );
}
