"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Loader2,
  Users,
  User,
  Hash,
  Mail,
  MapPin,
  Twitter,
  Github,
} from "lucide-react";
import { HomeNavbar } from "@/components/website/HomeNavbar";
import { Footer } from "@/components/website/Footer";

interface RegistrationData {
  id: string;
  fullName: string;
  userEmail: string;
  city: string | null;
  twitterHandle: string | null;
  githubHandle: string | null;
  primaryRole: string;
  techStack: string[];
  experience: string;
  teamMode: string;
  trackPreference: string | null;
  status: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    code: string;
    captainEmail: string;
    members: { email: string; role: string; joinedAt: string }[];
  } | null;
  run: {
    id: string;
    slug: string;
    monthLabel: string;
    status: string;
  };
}

export default function RegistrationStatusClient() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/speedrun?login=1");
      return;
    }
    if (status !== "authenticated") return;
    fetch("/api/speedrun/registrations/my")
      .then((r) => r.json())
      .then((res) => {
        if (!res.registered) {
          router.replace("/speedrun/register");
          return;
        }
        setData(res.registration);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  function copyTeamCode() {
    if (!data?.team?.code) return;
    navigator.clipboard.writeText(data.team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white">
        <HomeNavbar />
        <div className="pt-32 px-6 text-center text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          Loading...
        </div>
      </main>
    );
  }

  if (!data) return null;

  const statusBadgeClass =
    data.status === "confirmed"
      ? "bg-green-500/10 text-green-500 border-green-500/30"
      : data.status === "withdrawn" || data.status === "rejected"
      ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
      : "bg-red-500/10 text-red-500 border-red-500/30";

  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <HomeNavbar />

      <section className="relative pt-28 sm:pt-36 pb-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-red-500/20 via-red-500/5 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <Link
            href="/speedrun"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Speedrun
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-3"
          >
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-widest ${statusBadgeClass}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {data.status}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              {data.run.monthLabel}
            </span>
          </motion.div>

          <h1
            className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-3"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            YOU'RE IN.
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed mb-2">
            We'll email you when the theme drops on Day 1.
          </p>
        </div>
      </section>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pb-24 space-y-6">
        {/* Team Card */}
        {data.team ? (
          <Card>
            <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
                  Your Team
                </p>
                <h2 className="font-black italic tracking-tight text-2xl sm:text-3xl text-black dark:text-white">
                  {data.team.name}
                </h2>
              </div>
              <button
                onClick={copyTeamCode}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                type="button"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5">
              <Hash className="w-5 h-5 text-red-500" />
              <span className="font-black italic tracking-tighter text-2xl sm:text-3xl text-black dark:text-white">
                {data.team.code}
              </span>
              <span className="ml-auto text-xs text-zinc-500">
                Share with teammates to join
              </span>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
              Members ({data.team.members.length})
            </p>
            <ul className="space-y-2">
              {data.team.members.map((m) => (
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
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">
                  Solo Builder
                </p>
                <h2 className="font-black italic tracking-tight text-xl sm:text-2xl text-black dark:text-white">
                  Going It Alone
                </h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              You registered as a solo builder. You can find a team in the community channel
              before submissions open.
            </p>
          </Card>
        )}

        {/* Profile Card */}
        <Card>
          <h2 className="font-black italic tracking-tight text-xl sm:text-2xl text-black dark:text-white mb-5">
            Your Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <DetailRow icon={<User className="w-4 h-4" />} label="Name" value={data.fullName} />
            <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={data.userEmail} />
            <DetailRow
              icon={<MapPin className="w-4 h-4" />}
              label="City"
              value={data.city || "—"}
            />
            <DetailRow
              icon={<Users className="w-4 h-4" />}
              label="Role"
              value={data.primaryRole}
            />
            {data.twitterHandle && (
              <DetailRow
                icon={<Twitter className="w-4 h-4" />}
                label="X"
                value={`@${data.twitterHandle}`}
              />
            )}
            {data.githubHandle && (
              <DetailRow
                icon={<Github className="w-4 h-4" />}
                label="GitHub"
                value={`@${data.githubHandle}`}
              />
            )}
          </dl>

          {data.techStack.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-6 mb-2">
                Tech Stack
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.techStack.map((t) => (
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

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/speedrun"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-black/10 dark:border-white/10 text-black dark:text-white font-bold text-sm uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-all flex-1"
          >
            Back to Speedrun
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6 md:p-8">
      {children}
    </section>
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
