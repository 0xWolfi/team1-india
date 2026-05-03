"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Megaphone,
  Hammer,
  MapPin,
  Award,
  Trophy,
  Loader2,
  CheckCircle2,
  Sparkles,
  Users,
  Code2,
  ExternalLink,
  Github,
  Youtube,
  Twitter,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

interface Track {
  id: string;
  name: string;
  iconKey: string | null;
  tagline: string;
  description: string | null;
}

interface Run {
  id: string;
  slug: string;
  monthLabel: string;
  theme: string | null;
  themeDescription: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  submissionOpenDate: string | null;
  irlEventDate: string | null;
  winnersDate: string | null;
  sponsors: { md?: string } | null;
  prizePool: string | null;
  hostCities: string[];
  faq: { md?: string } | null;
  isCurrent: boolean;
  tracks: Track[];
}

interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  videoUrl: string | null;
  socialPostUrl: string | null;
  techStack: string[];
  speedrunTrack: { id: string; name: string; iconKey: string | null } | null;
  team: { id: string; team1Id: string } | null;
}

interface PublicTeamMember {
  team1Id: string;
  firstName: string;
  city: string | null;
  primaryRole: string | null;
  isCaptain: boolean;
  twitterHandle: string | null;
  githubHandle: string | null;
}

interface PublicTeam {
  id: string;
  team1Id: string;
  memberCount: number;
  members: PublicTeamMember[];
}

interface MyRegistration {
  registered: boolean;
  registration: {
    id: string;
    fullName: string;
    teamMode: string;
    status: string;
    team: {
      id: string;
      name: string | null;
      code: string;
      captainEmail: string;
      members: { email: string; role: string; joinedAt: string }[];
    } | null;
  } | null;
}

type Tab = "overview" | "tracks" | "timeline" | "projects" | "teams" | "faq";

export default function RunDetailsClient({ slug }: { slug: string }) {
  const { status: authStatus } = useSession();
  const [data, setData] = useState<{
    run: Run;
    projects: ProjectCard[];
    teams: PublicTeam[];
  } | null>(null);
  const [my, setMy] = useState<MyRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/speedrun/runs/${encodeURIComponent(slug)}/public`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e: Error) => setError(e.message || "Failed to load run"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setMy(null);
      return;
    }
    fetch(`/api/speedrun/runs/${encodeURIComponent(slug)}/my-registration`)
      .then((r) => r.json())
      .then((d) => setMy(d))
      .catch(() => setMy(null));
  }, [slug, authStatus]);

  if (loading) {
    return (
      <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white">
        <FloatingNav />
        <div className="pt-32 px-6 text-center text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          Loading run...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white">
        <FloatingNav />
        <div className="pt-32 px-6 text-center max-w-lg mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">
            Not found
          </p>
          <h1 className="font-black italic tracking-tighter text-4xl mb-4">
            THIS RUN ISN’T LIVE.
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            {error || "We couldn’t find a Speedrun at that URL."}
          </p>
          <Link
            href="/speedrun"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Speedrun
          </Link>
        </div>
      </main>
    );
  }

  const { run, projects, teams } = data;

  // The caller's own submission for this run (if they have one and own it)
  // — used by the Overview side panel to surface the "edit" action.
  const myTeam1Id = my?.registration?.team?.code ?? null;
  const myProject =
    projects.find(
      (p) => myTeam1Id && p.team?.team1Id?.toUpperCase() === myTeam1Id.toUpperCase()
    ) ?? null;

  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <FloatingNav />

      <Hero run={run} my={my} />
      <SubNav tab={tab} setTab={setTab} projectCount={projects.length} teamCount={teams.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-24">
        {tab === "overview" && <Overview run={run} my={my} myProject={myProject} />}
        {tab === "timeline" && <Timeline run={run} />}
        {tab === "tracks" && <TracksSection tracks={run.tracks} />}
        {tab === "projects" && <ProjectsList projects={projects} />}
        {tab === "teams" && <TeamsList teams={teams} runSlug={run.slug} />}
        {tab === "faq" && <FaqSection run={run} />}
      </div>

      <Footer />
    </main>
  );
}

/* ─── Hero ─── */

function Hero({ run, my }: { run: Run; my: MyRegistration | null }) {
  const closeDate = run.registrationDeadline ? new Date(run.registrationDeadline) : null;
  const countdown = useCountdown(closeDate);
  const registrationOpen = run.status === "registration_open";

  return (
    <section className="relative pt-28 sm:pt-32 md:pt-36 pb-12 overflow-hidden">
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Link
          href="/speedrun"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Speedruns
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <RunStatusBadge status={run.status} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            {run.monthLabel}
          </span>
          {run.isCurrent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Live
            </span>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-3"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
        >
          {run.theme || "THEME TBA"}
        </motion.h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          A monthly themed build sprint — solo or duo, ship fast, win prizes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 max-w-4xl">
          {closeDate && registrationOpen && (
            <HeroFact
              icon={<Calendar className="w-4 h-4" />}
              label="Reg closes"
              value={countdown ?? formatShortDate(closeDate)}
            />
          )}
          {run.prizePool && (
            <HeroFact
              icon={<Trophy className="w-4 h-4" />}
              label="Prize"
              value={run.prizePool}
            />
          )}
          {run.tracks.length > 0 && (
            <HeroFact
              icon={<Code2 className="w-4 h-4" />}
              label="Tracks"
              value={`${run.tracks.length}`}
            />
          )}
          <HeroFact
            icon={<MapPin className="w-4 h-4" />}
            label="Cities"
            value={run.hostCities.length > 0 ? run.hostCities.join(", ") : "TBA"}
          />
        </div>

        {/* CTA strip */}
        <HeroCTA run={run} my={my} />
      </div>
    </section>
  );
}

function HeroCTA({ run, my }: { run: Run; my: MyRegistration | null }) {
  const isRegistered = my?.registered === true;
  const canRegister = run.status === "registration_open";
  const slug = run.slug;

  if (canRegister && !isRegistered) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/speedrun/${encodeURIComponent(slug)}/register`}
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all"
        >
          Join the Run
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }
  if (isRegistered) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/speedrun/${encodeURIComponent(slug)}/registration`}
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 transition-all"
        >
          Your Registration
          <ArrowRight className="w-4 h-4" />
        </Link>
        {my?.registration?.team && (
          <Link
            href={`/speedrun/${encodeURIComponent(slug)}/team/${encodeURIComponent(my.registration.team.code)}`}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-red-500/30 text-red-500 font-bold text-sm uppercase tracking-wider hover:bg-red-500/10 transition-all"
          >
            <Users className="w-4 h-4" />
            {my.registration.team.code}
          </Link>
        )}
      </div>
    );
  }
  return null;
}

function HeroFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5">
      <div className="text-red-500">{icon}</div>
      <div className="leading-tight min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">{label}</div>
        <div className="text-sm font-black tracking-tight text-black dark:text-white truncate">{value}</div>
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const tone =
    status === "registration_open" || status === "submissions_open"
      ? "bg-green-500/10 text-green-500 border-green-500/30"
      : status === "completed"
      ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
      : status === "cancelled"
      ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
      : status === "submissions_closed" || status === "irl_event" || status === "judging"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
      : "bg-red-500/10 text-red-500 border-red-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${tone}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Sub-nav ─── */

function SubNav({
  tab,
  setTab,
  projectCount,
  teamCount,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  projectCount: number;
  teamCount: number;
}) {
  const items: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "timeline", label: "Timeline" },
    { key: "tracks", label: "Tracks" },
    { key: "projects", label: "Projects", badge: projectCount },
    { key: "teams", label: "Teams", badge: teamCount },
    { key: "faq", label: "FAQ" },
  ];
  return (
    <div className="border-y border-black/5 dark:border-white/5 bg-white/60 dark:bg-zinc-950/60 backdrop-blur sticky top-16 z-30 mb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                tab === it.key
                  ? "bg-red-500 text-white"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              {it.label}
              {typeof it.badge === "number" && it.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    tab === it.key ? "bg-white/20" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {it.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tabs ─── */

function Overview({
  run,
  my,
  myProject,
}: {
  run: Run;
  my: MyRegistration | null;
  myProject: ProjectCard | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10">
      <div className="space-y-8">
        {run.themeDescription ? (
          <Section title="Theme">
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{run.themeDescription}</ReactMarkdown>
            </article>
          </Section>
        ) : (
          <Section title="Theme">
            <p className="text-sm text-zinc-500">
              Theme description hasn’t been published yet — check back soon.
            </p>
          </Section>
        )}

        {run.sponsors?.md && (
          <Section title="Sponsors">
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{run.sponsors.md}</ReactMarkdown>
            </article>
          </Section>
        )}
      </div>
      <aside className="space-y-6">
        <MyTeamCard run={run} my={my} />
        <SubmissionCard run={run} my={my} myProject={myProject} />
      </aside>
    </div>
  );
}

function MyTeamCard({ run, my }: { run: Run; my: MyRegistration | null }) {
  if (!my) {
    return (
      <Section title="Your Team">
        <p className="text-xs text-zinc-500 mb-4">Sign in to see your team for this run.</p>
        <Link
          href={`/speedrun/${encodeURIComponent(run.slug)}/register`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
        >
          Sign in &amp; Register
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Section>
    );
  }
  if (!my.registered) {
    return (
      <Section title="Your Team">
        <p className="text-xs text-zinc-500 mb-4">You’re not registered for this run yet.</p>
        {run.status === "registration_open" && (
          <Link
            href={`/speedrun/${encodeURIComponent(run.slug)}/register`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
          >
            Join the Run
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </Section>
    );
  }
  const reg = my.registration!;
  return (
    <Section title="Your Team">
      {reg.team ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
            Team1 ID
          </p>
          <p className="font-black italic tracking-tighter text-2xl text-black dark:text-white mb-3">
            {reg.team.code}
          </p>
          <p className="text-xs text-zinc-500 mb-3">
            {reg.team.members.length} member{reg.team.members.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-black dark:text-white mb-3">
          You’re registered as a <strong>solo builder</strong>.
        </p>
      )}
      <Link
        href={`/speedrun/${encodeURIComponent(run.slug)}/registration`}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
      >
        Manage registration
        <ArrowRight className="w-3 h-3" />
      </Link>
    </Section>
  );
}

function SubmissionCard({
  run,
  my,
  myProject,
}: {
  run: Run;
  my: MyRegistration | null;
  myProject: ProjectCard | null;
}) {
  const submissionWindow = run.status === "submissions_open";
  const submissionsLater = run.status === "registration_open";
  const closedOrLater = !submissionWindow && !submissionsLater;

  return (
    <Section title="Your Submission">
      {!my?.registered ? (
        <p className="text-xs text-zinc-500">Register first to submit a project.</p>
      ) : myProject ? (
        // Already submitted — show a tile linking to the canonical project
        // page. Edit UI for UserProject lives outside this feature.
        <div>
          <Link
            href={`/public/projects/${encodeURIComponent(myProject.slug)}`}
            className="block rounded-xl border border-red-500/30 bg-red-500/5 p-3 hover:border-red-500/60 transition-colors mb-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
              Your project
            </p>
            <p className="font-bold text-sm text-black dark:text-white truncate">
              {myProject.title}
            </p>
            {myProject.team && (
              <p className="text-[10px] font-mono text-zinc-500 mt-1">{myProject.team.team1Id}</p>
            )}
          </Link>
          <p className="text-[11px] text-zinc-500">
            Project lives on its own page — manage it from there.
          </p>
        </div>
      ) : submissionsLater ? (
        <p className="text-xs text-zinc-500">
          Submission portal opens{" "}
          {run.submissionOpenDate ? formatShortDate(new Date(run.submissionOpenDate)) : "soon"}.
        </p>
      ) : submissionWindow ? (
        <div>
          <p className="text-xs text-zinc-500 mb-3">
            Submissions are open. Edits stay open after — every save is versioned.
          </p>
          <Link
            href={`/speedrun/${encodeURIComponent(run.slug)}/submit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Submit Project
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : closedOrLater ? (
        <p className="text-xs text-zinc-500">
          Submissions are closed and you didn&apos;t submit a project for this run.
        </p>
      ) : null}
    </Section>
  );
}

function Timeline({ run }: { run: Run }) {
  const items = [
    { date: run.startDate, label: "Run starts", icon: <Megaphone className="w-4 h-4" /> },
    {
      date: run.submissionOpenDate,
      label: "Submissions open",
      icon: <Hammer className="w-4 h-4" />,
    },
    {
      date: run.registrationDeadline,
      label: "Reg + submissions close",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    { date: run.irlEventDate, label: "IRL event", icon: <MapPin className="w-4 h-4" /> },
    { date: run.winnersDate, label: "Winners announced", icon: <Award className="w-4 h-4" /> },
  ].filter((i) => i.date);

  if (items.length === 0) {
    return (
      <Section title="Timeline">
        <p className="text-sm text-zinc-500">Dates haven’t been published yet.</p>
      </Section>
    );
  }
  return (
    <Section title="Timeline">
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {items.map((it, i) => (
          <li
            key={i}
            className="rounded-xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-4"
          >
            <div className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 mb-3">
              {it.icon}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
              {it.label}
            </p>
            <p className="text-sm font-black tracking-tight text-black dark:text-white">
              {formatLongDate(new Date(it.date as string))}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function TracksSection({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) {
    return (
      <Section title="Tracks">
        <p className="text-sm text-zinc-500">Tracks for this run haven’t been announced yet.</p>
      </Section>
    );
  }
  return (
    <Section title="Tracks">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((t) => {
          const Icon = resolveIcon(t.iconKey);
          return (
            <article
              key={t.id}
              className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6"
            >
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-black italic tracking-tight text-lg mb-2 text-black dark:text-white">
                {t.name}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                {t.tagline}
              </p>
              {t.description && (
                <article className="prose prose-sm dark:prose-invert max-w-none text-xs">
                  <ReactMarkdown>{t.description}</ReactMarkdown>
                </article>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}

function ProjectsList({ projects }: { projects: ProjectCard[] }) {
  if (projects.length === 0) {
    return (
      <Section title="Projects">
        <p className="text-sm text-zinc-500">
          No projects submitted yet. They’ll show up here once builders ship.
        </p>
      </Section>
    );
  }
  return (
    <Section title="Projects">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/public/projects/${encodeURIComponent(p.slug)}`}
            className="group rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 overflow-hidden hover:border-red-500/40 transition-all"
          >
            {p.coverImage ? (
              <div className="relative aspect-video bg-black/5 dark:bg-white/5">
                <Image
                  src={p.coverImage}
                  alt={p.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-500/40" />
              </div>
            )}
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {p.speedrunTrack && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                    {p.speedrunTrack.name}
                  </span>
                )}
                {p.team && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-zinc-500 text-[10px] font-mono">
                    {p.team.team1Id}
                  </span>
                )}
              </div>
              <h3 className="font-black italic tracking-tight text-base mb-1 text-black dark:text-white group-hover:text-red-500 transition-colors">
                {p.title}
              </h3>
              {p.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                  {p.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-zinc-400">
                {p.demoUrl && <ExternalLink className="w-3.5 h-3.5" aria-label="Demo" />}
                {p.repoUrl && <Github className="w-3.5 h-3.5" aria-label="Repo" />}
                {p.videoUrl && <Youtube className="w-3.5 h-3.5" aria-label="Video" />}
                {p.socialPostUrl && <Twitter className="w-3.5 h-3.5" aria-label="X post" />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function TeamsList({ teams, runSlug }: { teams: PublicTeam[]; runSlug: string }) {
  if (teams.length === 0) {
    return (
      <Section title="Teams">
        <p className="text-sm text-zinc-500">No teams yet for this run.</p>
      </Section>
    );
  }
  return (
    <Section title="Teams">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/speedrun/${encodeURIComponent(runSlug)}/team/${encodeURIComponent(t.team1Id)}`}
            className="rounded-xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-4 hover:border-red-500/40 transition-colors"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
              Team1 ID
            </p>
            <p className="font-black italic tracking-tighter text-xl text-black dark:text-white mb-3">
              {t.team1Id}
            </p>
            <ul className="space-y-1">
              {t.members.map((m, i) => (
                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 inline-flex items-center justify-center text-[10px] font-bold">
                    {m.firstName?.[0]?.toUpperCase() || "?"}
                  </span>
                  {m.firstName || "Anon"}
                  {m.isCaptain && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">
                      Captain
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function FaqSection({ run }: { run: Run }) {
  const md = run.faq?.md;
  return (
    <Section title="FAQ">
      {md ? (
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{md}</ReactMarkdown>
        </article>
      ) : (
        <p className="text-sm text-zinc-500">FAQ for this run hasn’t been published yet.</p>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">{title}</h2>
      {children}
    </section>
  );
}

/* ─── Helpers ─── */

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function formatLongDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 60_000); // refresh once a minute
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  if (days > 0) return `in ${days}d ${hours}h`;
  return `in ${hours}h`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_LIB = LucideIcons as any;
function resolveIcon(key: string | null) {
  if (!key) return Sparkles;
  return ICON_LIB[key] || Sparkles;
}

