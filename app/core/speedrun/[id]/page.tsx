"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Github,
  Hash,
  Users,
  Save,
  Calendar,
  Flame,
} from "lucide-react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface RegistrationDetail {
  id: string;
  fullName: string;
  userEmail: string;
  phone: string | null;
  city: string | null;
  twitterHandle: string | null;
  githubHandle: string | null;
  primaryRole: string;
  techStack: string[];
  experience: string;
  teamMode: string;
  trackPreference: string | null;
  projectIdea: string | null;
  whyJoin: string | null;
  consent: boolean;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
    code: string;
    captainEmail: string;
    members: { email: string; role: string; joinedAt: string }[];
  } | null;
  run: { id: string; slug: string; monthLabel: string };
}

interface Teammate {
  id: string;
  fullName: string;
  userEmail: string;
  primaryRole: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "registered", label: "Registered" },
  { value: "confirmed", label: "Confirmed" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "rejected", label: "Rejected" },
];

export default function CoreSpeedrunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reg, setReg] = useState<RegistrationDetail | null>(null);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Editable fields
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/speedrun/registrations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.registration) {
          setReg(data.registration);
          setStatus(data.registration.status);
          setAdminNotes(data.registration.adminNotes || "");
          setTeammates(data.teammates || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!reg) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/speedrun/registrations/${reg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (res.ok) {
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <CoreWrapper>
        <div className="text-center py-20 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          Loading registration...
        </div>
      </CoreWrapper>
    );
  }

  if (!reg) {
    return (
      <CoreWrapper>
        <div className="text-center py-20 text-sm text-zinc-500">
          Registration not found.
        </div>
      </CoreWrapper>
    );
  }

  return (
    <CoreWrapper>
      <button
        onClick={() => router.push("/core/speedrun")}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Registrations
      </button>

      <CorePageHeader
        title={reg.fullName}
        description={`Registered for ${reg.run.monthLabel} · ${new Date(reg.createdAt).toLocaleDateString()}`}
        icon={<Flame className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column: detail cards */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Profile */}
          <Card title="Profile">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={reg.userEmail} />
              <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={reg.phone || "—"} />
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="City" value={reg.city || "—"} />
              <DetailRow icon={<Users className="w-4 h-4" />} label="Role" value={reg.primaryRole} />
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Experience"
                value={reg.experience}
              />
              {reg.twitterHandle && (
                <DetailRow
                  icon={<Twitter className="w-4 h-4" />}
                  label="X / Twitter"
                  value={`@${reg.twitterHandle}`}
                />
              )}
              {reg.githubHandle && (
                <DetailRow
                  icon={<Github className="w-4 h-4" />}
                  label="GitHub"
                  value={`@${reg.githubHandle}`}
                />
              )}
            </dl>

            {reg.techStack.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-6 mb-2">
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {reg.techStack.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-[11px] font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Team */}
          <Card title="Team">
            {reg.team ? (
              <>
                <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                  <div>
                    <div className="font-black italic tracking-tight text-xl sm:text-2xl text-black dark:text-white">
                      {reg.team.name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Captain: {reg.team.captainEmail}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5">
                    <Hash className="w-4 h-4 text-red-500" />
                    <span className="font-mono text-sm font-bold text-black dark:text-white">
                      {reg.team.code}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Members ({reg.team.members.length})
                </p>
                <ul className="space-y-2 mb-4">
                  {reg.team.members.map((m) => (
                    <li
                      key={m.email}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5"
                    >
                      <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold">
                        {m.email[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-black dark:text-white truncate flex-1">
                        {m.email}
                      </span>
                      {m.role === "captain" && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                          Captain
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {teammates.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                      Other team members' registrations
                    </p>
                    <ul className="space-y-1.5">
                      {teammates.map((t) => (
                        <li key={t.id}>
                          <a
                            href={`/core/speedrun/${t.id}`}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-black/5 dark:border-white/5 hover:border-red-500/40 transition-colors"
                          >
                            <span className="text-sm text-black dark:text-white">
                              {t.fullName}{" "}
                              <span className="text-zinc-500">· {t.primaryRole}</span>
                            </span>
                            <span className="text-xs text-red-500 font-bold uppercase tracking-wider">
                              View
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-500">Solo registration — not part of a team.</p>
            )}
          </Card>

          {/* Project & Motivation */}
          <Card title="Project & Motivation">
            <Section label="Track Preference">
              {reg.trackPreference || <span className="text-zinc-500">—</span>}
            </Section>
            <Section label="Project Idea">
              {reg.projectIdea ? (
                <p className="whitespace-pre-wrap">{reg.projectIdea}</p>
              ) : (
                <span className="text-zinc-500">No idea submitted</span>
              )}
            </Section>
            <Section label="Why Join">
              {reg.whyJoin ? (
                <p className="whitespace-pre-wrap">{reg.whyJoin}</p>
              ) : (
                <span className="text-zinc-500">—</span>
              )}
            </Section>
            <div className="text-xs text-zinc-500">
              Code of conduct: {reg.consent ? "✓ Accepted" : "✗ Not accepted"}
            </div>
          </Card>
        </div>

        {/* Right column: admin actions */}
        <div className="space-y-4 sm:space-y-6">
          <Card title="Admin Actions">
            <label className="block mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white focus:outline-none focus:border-red-500/50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Internal Notes
              </span>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes for the team — only visible to CORE members"
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/50 resize-y"
              />
            </label>

            <button
              onClick={save}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {savedAt && (
              <p className="text-[10px] text-green-500 mt-2 text-center">
                Saved {new Date(savedAt).toLocaleTimeString()}
              </p>
            )}
          </Card>

          <Card title="Meta">
            <dl className="space-y-2 text-xs">
              <Meta label="Run" value={reg.run.monthLabel} />
              <Meta label="Team mode" value={reg.teamMode} />
              <Meta
                label="Registered"
                value={new Date(reg.createdAt).toLocaleString()}
              />
              <Meta label="Updated" value={new Date(reg.updatedAt).toLocaleString()} />
              <Meta label="ID" value={reg.id} mono />
            </dl>
          </Card>
        </div>
      </div>
    </CoreWrapper>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 sm:p-5 md:p-6">
      <h2 className="font-black italic tracking-tight text-base sm:text-lg text-black dark:text-white mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
        {label}
      </p>
      <div className="text-sm text-black dark:text-white">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center mt-0.5 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
          {label}
        </dt>
        <dd className="text-sm text-black dark:text-white truncate">{value}</dd>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 shrink-0">
        {label}
      </dt>
      <dd
        className={`text-xs text-black dark:text-white text-right ${
          mono ? "font-mono" : ""
        } truncate`}
      >
        {value}
      </dd>
    </div>
  );
}
