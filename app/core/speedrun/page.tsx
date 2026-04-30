"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Loader2,
  Users,
  User,
  Hash,
  Mail,
  ChevronRight,
  Flame,
  Calendar,
  Share2,
  Eye,
  TrendingUp,
} from "lucide-react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface Registration {
  id: string;
  fullName: string;
  userEmail: string;
  city: string | null;
  primaryRole: string;
  experience: string;
  teamMode: string;
  status: string;
  createdAt: string;
  team: { id: string; name: string; code: string; captainEmail: string } | null;
  run: { id: string; slug: string; monthLabel: string };
}

interface RunOption {
  id: string;
  slug: string;
  monthLabel: string;
  status: string;
  isCurrent: boolean;
}

interface ReferralRow {
  id: string;
  code: string;
  userEmail: string;
  clicks: number;
  conversions: number;
  createdAt: string;
  registrations: {
    id: string;
    fullName: string;
    userEmail: string;
    createdAt: string;
    run: { monthLabel: string; slug: string };
  }[];
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "registered", label: "Registered" },
  { value: "confirmed", label: "Confirmed" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "rejected", label: "Rejected" },
];

export default function CoreSpeedrunPage() {
  const [tab, setTab] = useState<"registrations" | "referrals">("registrations");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [runs, setRuns] = useState<RunOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [runFilter, setRunFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Referrals tab state
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "registrations") return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (runFilter) params.set("runId", runFilter);
    if (search) params.set("q", search);
    fetch(`/api/speedrun/registrations?${params.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        setRegistrations(data.registrations || []);
        setRuns(data.runs || []);
      })
      .catch((e: Error) => setError(e.message || "Failed to load registrations"))
      .finally(() => setLoading(false));
  }, [statusFilter, runFilter, search, tab]);

  useEffect(() => {
    if (tab !== "referrals") return;
    setReferralsLoading(true);
    setReferralsError(null);
    fetch("/api/speedrun/referrals/all", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => setReferrals(data.referrals || []))
      .catch((e: Error) => setReferralsError(e.message || "Failed to load referrals"))
      .finally(() => setReferralsLoading(false));
  }, [tab]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const teams = new Set(
      registrations.filter((r) => r.team).map((r) => r.team!.id)
    ).size;
    const solo = registrations.filter((r) => r.teamMode === "solo").length;
    const confirmed = registrations.filter((r) => r.status === "confirmed").length;
    return { total, teams, solo, confirmed };
  }, [registrations]);

  return (
    <CoreWrapper>
      <CorePageHeader
        title="Speedrun"
        description="Monthly themed build challenge — registrations, teams, and run management."
        icon={<Flame className="w-5 h-5" />}
      />

      {/* Tab switcher */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 mb-6">
        <button
          onClick={() => setTab("registrations")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === "registrations"
              ? "bg-red-500 text-white"
              : "text-zinc-500 hover:text-black dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 inline -mt-0.5 mr-1.5" />
          Registrations
        </button>
        <button
          onClick={() => setTab("referrals")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === "referrals"
              ? "bg-red-500 text-white"
              : "text-zinc-500 hover:text-black dark:hover:text-white"
          }`}
        >
          <Share2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1.5" />
          Referrals
        </button>
      </div>

      {tab === "registrations" && (
      <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total" value={stats.total} icon={<Users className="w-4 h-4" />} />
        <StatCard label="Teams" value={stats.teams} icon={<Hash className="w-4 h-4" />} />
        <StatCard label="Solo" value={stats.solo} icon={<User className="w-4 h-4" />} />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or city"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 transition-all"
          />
        </div>

        <select
          value={runFilter}
          onChange={(e) => setRunFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="">All runs</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.monthLabel}
              {r.isCurrent ? " · Current" : ""}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 px-1 py-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-x-auto">
          <Filter className="w-4 h-4 text-zinc-400 ml-2 shrink-0" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                statusFilter === s.value
                  ? "bg-red-500 text-white"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
            Loading registrations...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm">
            <p className="text-red-500 font-semibold mb-1">Failed to load registrations</p>
            <p className="text-zinc-500 text-xs">{error}</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            No registrations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">City</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Team</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Run</th>
                  <th className="text-right px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-semibold text-black dark:text-white">
                      {r.fullName}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {r.userEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">
                      {r.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.primaryRole}</td>
                    <td className="px-4 py-3">
                      {r.team ? (
                        <div className="flex flex-col">
                          <span className="text-black dark:text-white text-xs font-semibold">
                            {r.team.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {r.team.code}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                          <User className="w-3 h-3" />
                          Solo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">
                      {r.run.monthLabel}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/core/speedrun/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
                      >
                        View
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {tab === "referrals" && (
        <ReferralsTab
          referrals={referrals}
          loading={referralsLoading}
          error={referralsError}
        />
      )}
    </CoreWrapper>
  );
}

function ReferralsTab({
  referrals,
  loading,
  error,
}: {
  referrals: ReferralRow[];
  loading: boolean;
  error: string | null;
}) {
  const totals = {
    codes: referrals.length,
    clicks: referrals.reduce((s, r) => s + r.clicks, 0),
    conversions: referrals.reduce((s, r) => s + r.conversions, 0),
    activeReferrers: referrals.filter((r) => r.conversions > 0).length,
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Codes" value={totals.codes} icon={<Hash className="w-4 h-4" />} />
        <StatCard label="Clicks" value={totals.clicks} icon={<Eye className="w-4 h-4" />} />
        <StatCard label="Signups" value={totals.conversions} icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Referrers" value={totals.activeReferrers} icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
            Loading referrals...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm">
            <p className="text-red-500 font-semibold mb-1">Failed to load referrals</p>
            <p className="text-zinc-500 text-xs">{error}</p>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            No referral codes generated yet. Referral codes are created lazily — when a signed-in user first views the Speedrun page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="text-left px-4 py-3">Referrer</th>
                  <th className="text-left px-4 py-3">Code</th>
                  <th className="text-right px-4 py-3">Clicks</th>
                  <th className="text-right px-4 py-3">Signups</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Conversion</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Referred users</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => {
                  const rate = r.clicks > 0 ? Math.round((r.conversions / r.clicks) * 100) : 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] align-top"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-black dark:text-white font-semibold">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate max-w-[200px]">{r.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold px-2 py-1 rounded-md bg-red-500/10 text-red-500">
                          {r.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {r.clicks}
                      </td>
                      <td className="px-4 py-3 text-right text-black dark:text-white font-bold tabular-nums">
                        {r.conversions}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500 hidden md:table-cell tabular-nums">
                        {r.clicks > 0 ? `${rate}%` : "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {r.registrations.length === 0 ? (
                          <span className="text-zinc-500 text-xs">None yet</span>
                        ) : (
                          <ul className="space-y-1">
                            {r.registrations.slice(0, 3).map((reg) => (
                              <li key={reg.id} className="text-xs">
                                <Link
                                  href={`/core/speedrun/${reg.id}`}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  {reg.fullName}
                                </Link>
                                <span className="text-zinc-500"> · {reg.run.monthLabel}</span>
                              </li>
                            ))}
                            {r.registrations.length > 3 && (
                              <li className="text-xs text-zinc-500">
                                +{r.registrations.length - 3} more
                              </li>
                            )}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-red-500/15 bg-white dark:bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">
        {icon}
        {label}
      </div>
      <div className="font-black italic tracking-tighter text-3xl text-black dark:text-white leading-none">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    registered: "bg-red-500/10 text-red-500 border-red-500/30",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/30",
    withdrawn: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
    rejected: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${
        map[status] || map.registered
      }`}
    >
      {status}
    </span>
  );
}
