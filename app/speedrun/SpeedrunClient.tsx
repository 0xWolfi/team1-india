"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Zap,
  Rocket,
  Trophy,
  UserPlus,
  Code2,
  PlayCircle,
  Check,
  CheckCircle2,
  Loader2,
  Share2,
  Copy,
  Eye,
  Users,
  Lock,
  Sparkles,
  History,
  Flame,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";

/* ═══════════════════════════════════════════
   Static content
   ═══════════════════════════════════════════ */

const whatCards = [
  { icon: Zap, title: "BUILD", desc: "Turn ideas into reality with speed and focus." },
  { icon: Rocket, title: "SHIP", desc: "Deliver working products, not just presentations." },
  { icon: Trophy, title: "COMPETE", desc: "Compete, learn and win exciting prizes." },
];

const howSteps = [
  { n: "01", icon: UserPlus, title: "REGISTER", desc: "Sign up, pick solo or duo, get your Team1 ID." },
  { n: "02", icon: Code2, title: "BUILD FAST", desc: "Theme drops Day 1. You have ~14 days to ship." },
  { n: "03", icon: PlayCircle, title: "DEMO & WIN", desc: "Pitch IRL, judges pick winners, recap goes out." },
];

const benefits = [
  "Solo or duo — keep it tight",
  "Real prize money each month",
  "Share builds at the IRL meet",
  "Recap and amplification on X",
];

const whoShouldApply = [
  { title: "Builders", desc: "Engineers, designers, and product folks who want to ship something real." },
  { title: "Solo or duo", desc: "Max 2 per team. Switch between solo and team anytime before submissions close." },
  { title: "Any level", desc: "Beginners, intermediates, advanced — pick a track that fits and go." },
];

const defaultFaq: { q: string; a: string }[] = [
  {
    q: "Who can join?",
    a: "Anyone — students, employed builders, indie hackers. Solo or in a duo (max 2).",
  },
  {
    q: "What does it cost?",
    a: "Nothing. Speedrun is free to enter.",
  },
  {
    q: "Do I need an idea before I register?",
    a: "No. The theme drops on Day 1 — you'll register first, then build to the theme.",
  },
  {
    q: "Can I change my team after registering?",
    a: "Yes. You can switch between solo / create / join anytime until submissions close.",
  },
  {
    q: "Do I have to attend the IRL event to win?",
    a: "Top finishers usually pitch live. Specific rules are announced per run on the run page.",
  },
];

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

interface PublicRun {
  id: string;
  slug: string;
  monthLabel: string;
  theme: string | null;
  status: string;
  startDate: string | null;
  registrationDeadline: string | null;
  irlEventDate: string | null;
  winnersDate: string | null;
  prizePool: string | null;
  hostCities: string[];
  isCurrent: boolean;
  _count?: { registrations: number; projects: number };
}

type RegState =
  | { phase: "loading" }
  | { phase: "anon"; currentRunSlug: string | null }
  | { phase: "auth-not-registered"; currentRunSlug: string | null }
  | { phase: "auth-registered"; currentRunSlug: string };

/* ═══════════════════════════════════════════
   Page
   ═══════════════════════════════════════════ */

export default function SpeedrunClient() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [regState, setRegState] = useState<RegState>({ phase: "loading" });
  const [liveRun, setLiveRun] = useState<PublicRun | null>(null);
  const [pastRuns, setPastRuns] = useState<PublicRun[]>([]);
  const [view, setView] = useState<"live" | "past">("live");

  // Open login modal when redirected back here with ?login=1
  useEffect(() => {
    if (searchParams?.get("login") === "1" && status === "unauthenticated") {
      setShowLoginModal(true);
    }
  }, [searchParams, status]);

  // Capture ?ref=CODE / utm_* for the register form to pick up
  useEffect(() => {
    if (!searchParams) return;
    const ref = searchParams.get("ref");
    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");
    try {
      if (ref) sessionStorage.setItem("speedrunRef", ref);
      if (utmSource) sessionStorage.setItem("speedrunUtmSource", utmSource);
      if (utmMedium) sessionStorage.setItem("speedrunUtmMedium", utmMedium);
      if (utmCampaign) sessionStorage.setItem("speedrunUtmCampaign", utmCampaign);
    } catch {}
  }, [searchParams]);

  // Load live + past runs and resolve registration state.
  useEffect(() => {
    if (status === "loading") {
      setRegState({ phase: "loading" });
      return;
    }
    let cancelled = false;
    (async () => {
      // Both live and past in parallel
      let liveSlug: string | null = null;
      try {
        const [liveRes, pastRes] = await Promise.all([
          fetch("/api/speedrun/runs/public?scope=live", { cache: "no-store" }),
          fetch("/api/speedrun/runs/public?scope=past", { cache: "no-store" }),
        ]);
        const liveData = await liveRes.json();
        const pastData = await pastRes.json();
        if (!cancelled) {
          const live = liveData.runs?.[0] ?? null;
          setLiveRun(live);
          setPastRuns(pastData.runs ?? []);
          liveSlug = live?.slug ?? null;
        }
      } catch {
        if (!cancelled) {
          setLiveRun(null);
          setPastRuns([]);
        }
      }

      if (cancelled) return;
      if (status === "unauthenticated") {
        setRegState({ phase: "anon", currentRunSlug: liveSlug });
        return;
      }
      if (!liveSlug) {
        setRegState({ phase: "auth-not-registered", currentRunSlug: null });
        return;
      }
      try {
        const res = await fetch(
          `/api/speedrun/runs/${encodeURIComponent(liveSlug)}/my-registration`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.registered && data.run?.slug) {
          setRegState({ phase: "auth-registered", currentRunSlug: data.run.slug });
        } else {
          setRegState({ phase: "auth-not-registered", currentRunSlug: liveSlug });
        }
      } catch {
        if (!cancelled) setRegState({ phase: "auth-not-registered", currentRunSlug: liveSlug });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  function handleJoinClick() {
    const slug =
      "currentRunSlug" in regState ? regState.currentRunSlug : null;
    if (!slug) return;
    const target = `/speedrun/${encodeURIComponent(slug)}/register`;
    const statusTarget = `/speedrun/${encodeURIComponent(slug)}/registration`;
    if (regState.phase === "anon") {
      try {
        sessionStorage.setItem("postLoginRedirect", target);
      } catch {}
      setShowLoginModal(true);
    } else if (regState.phase === "auth-not-registered") {
      router.push(target);
    } else if (regState.phase === "auth-registered") {
      router.push(statusTarget);
    }
  }

  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <FloatingNav />
      <PublicLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* ── HERO ── */}
      <Hero regState={regState} liveRun={liveRun} onJoin={handleJoinClick} />

      {/* ── LIVE / PAST TOGGLE + RUN CARDS ── */}
      <RunToggleSection
        view={view}
        setView={setView}
        liveRun={liveRun}
        pastRuns={pastRuns}
      />

      {/* ── WHAT IS SPEEDRUN ── */}
      <section
        id="about"
        className="relative py-16 md:py-24 scroll-mt-24 border-t border-black/5 dark:border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">Overview</p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-6"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
            >
              WHAT IS<br />SPEEDRUN?
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed mb-6">
              Speedrun is a time-boxed monthly challenge where builders come together to solve real
              problems, build real products, and ship them fast.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {whatCards.map((card) => (
              <article
                key={card.title}
                className="relative flex flex-col rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 hover:border-red-500/40 transition-all p-5 sm:p-6 group overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-red-500/10 blur-2xl group-hover:bg-red-500/25 transition-colors" />
                <div className="relative flex flex-col h-full">
                  <div
                    className="inline-flex w-12 h-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 mb-4"
                    style={{ filter: "drop-shadow(0 0 12px rgba(239,68,68,0.4))" }}
                  >
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black tracking-wider text-red-500 mb-2">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO SHOULD APPLY ── */}
      <section className="relative py-16 md:py-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">Who Should Apply</p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-6"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              IF YOU<br />SHIP — APPLY.
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Speedrun is open to anyone who wants to build something real on a tight clock. No
              gatekeeping, no résumé screen.
            </p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {whoShouldApply.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5"
              >
                <h3 className="font-black uppercase tracking-wider text-sm text-red-500 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        className="relative py-16 md:py-24 scroll-mt-24 border-t border-black/5 dark:border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 lg:gap-16">
          <div className="lg:max-w-xs">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">Process</p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-6"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
            >
              HOW IT<br />WORKS
            </h2>
            <div className="space-y-1 text-base sm:text-lg font-black uppercase tracking-tight italic">
              <p className="text-black dark:text-white">Be Fast.</p>
              <p className="text-black dark:text-white">Be Focused.</p>
              <p className="text-red-500">Be First.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-4 relative sm:pt-32">
            {howSteps.map((step, i) => (
              <article key={step.n} className="relative text-center">
                <p
                  className="sm:hidden font-black italic tracking-tighter leading-none text-transparent select-none whitespace-nowrap mb-3"
                  style={{ WebkitTextStroke: "1.5px rgba(239,68,68,0.35)", fontSize: "3.5rem" }}
                >
                  {step.n}
                </p>
                <p
                  className="hidden sm:block font-black italic tracking-tighter leading-none text-transparent absolute left-1/2 -translate-x-1/2 select-none whitespace-nowrap z-20"
                  style={{
                    WebkitTextStroke: "1.5px rgba(239,68,68,0.35)",
                    fontSize: "clamp(3rem, 6vw, 5rem)",
                    bottom: "calc(100% + 1.25rem)",
                  }}
                >
                  {step.n}
                </p>
                {i < howSteps.length - 1 && (
                  <div className="hidden sm:block absolute top-[1.75rem] left-[calc(50%+2rem)] right-[-50%] h-px bg-gradient-to-r from-red-500/60 to-red-500/10 z-0" />
                )}
                <div className="relative">
                  <div className="relative z-10 mx-auto inline-flex w-14 h-14 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-4">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black tracking-wider text-red-500 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[200px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="relative py-16 md:py-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">Why Join</p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-8"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
            >
              WHY JOIN<br />SPEEDRUN?
            </h2>
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-red-500 text-white flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-black dark:text-white">{b}</span>
                </li>
              ))}
            </ul>
            <JoinButton phase={regState.phase} onClick={handleJoinClick} variant="text" hasRun={!!liveRun} />
          </div>
          <div className="relative w-full aspect-square max-h-[50svh] max-w-[440px] sm:max-h-none sm:max-w-[560px] mx-auto lg:max-h-none lg:max-w-none lg:aspect-auto lg:h-[600px] xl:h-[680px]">
            <div
              className="absolute inset-0 blur-3xl scale-[0.7] dark:scale-75"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(239,68,68,0.3), rgba(239,68,68,0.06) 50%, transparent 75%)",
              }}
            />
            <Image
              src="/speedrun/thinker-statue.png"
              alt="Builder thinking"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain object-center relative z-10 drop-shadow-[0_0_60px_rgba(239,68,68,0.3)]"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── REFERRAL ── */}
      <ReferSection
        isAuthenticated={status === "authenticated"}
        onSignInClick={() => setShowLoginModal(true)}
      />

      {/* ── CTA BANNER ── */}
      <section className="relative bg-red-500 text-white py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2
            className="font-black italic tracking-tighter leading-[0.85] text-white mb-6"
            style={{ fontSize: "clamp(3rem, 11vw, 8rem)" }}
          >
            SPEEDRUN
          </h2>
          <p className="text-base sm:text-xl md:text-2xl font-bold uppercase tracking-wider mb-8 text-white/95">
            Are you ready to build at speed?
          </p>
          <JoinButton phase={regState.phase} onClick={handleJoinClick} variant="inverse" hasRun={!!liveRun} />
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ═══════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════ */

function Hero({
  regState,
  liveRun,
  onJoin,
}: {
  regState: RegState;
  liveRun: PublicRun | null;
  onJoin: () => void;
}) {
  return (
    <section className="relative pt-28 sm:pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-[60%] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-l from-red-500/20 via-red-500/5 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center">
        <div className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
              Team<sup>1</sup>
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Presents
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-6"
            style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)" }}
          >
            SPEEDRUN
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider text-black dark:text-white mb-4"
          >
            Build fast. Ship faster.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md mb-8 leading-relaxed"
          >
            A high-energy sprint for builders, thinkers, and doers. Solo or duo. Build. Ship. Win.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <JoinButton phase={regState.phase} onClick={onJoin} variant="primary" hasRun={!!liveRun} />
            {liveRun && (
              <Link
                href={`/speedrun/${encodeURIComponent(liveRun.slug)}`}
                className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 font-bold text-sm uppercase tracking-wider hover:bg-red-500/10 hover:border-red-500/50 transition-all"
              >
                This Month
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="relative w-full aspect-square max-h-[55svh] max-w-[440px] sm:max-h-none sm:max-w-[560px] mx-auto lg:max-h-none lg:max-w-none lg:aspect-auto lg:h-[560px] xl:h-[640px] lg:scale-105 lg:translate-x-4 lg:-translate-y-6 xl:-translate-y-8 xl:translate-x-8 z-0"
        >
          <div
            className="absolute inset-0 blur-3xl scale-[0.7] dark:scale-75"
            style={{
              background:
                "radial-gradient(circle at 55% 50%, rgba(239,68,68,0.4), rgba(239,68,68,0.08) 45%, transparent 70%)",
            }}
          />
          <Image
            src="/speedrun/hero-statue.png"
            alt="Speedrun"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-contain object-center relative z-10 drop-shadow-[0_0_60px_rgba(239,68,68,0.35)]"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Live / Past toggle
   ═══════════════════════════════════════════ */

function RunToggleSection({
  view,
  setView,
  liveRun,
  pastRuns,
}: {
  view: "live" | "past";
  setView: (v: "live" | "past") => void;
  liveRun: PublicRun | null;
  pastRuns: PublicRun[];
}) {
  return (
    <section className="relative py-12 md:py-20 border-t border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">Runs</p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              EVERY MONTH,<br />A NEW RUN.
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900">
            <button
              onClick={() => setView("live")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 ${
                view === "live" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Live
            </button>
            <button
              onClick={() => setView("past")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 ${
                view === "past" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Past
              {pastRuns.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    view === "past" ? "bg-white/20" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {pastRuns.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {view === "live" ? (
          liveRun ? (
            <LiveRunCard run={liveRun} />
          ) : (
            <div className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-8 text-center">
              <p className="text-sm text-zinc-500">No live run right now — the next one drops soon.</p>
            </div>
          )
        ) : pastRuns.length === 0 ? (
          <div className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-8 text-center">
            <p className="text-sm text-zinc-500">No past runs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastRuns.map((r) => (
              <PastRunCard key={r.id} run={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LiveRunCard({ run }: { run: PublicRun }) {
  const closeDate = run.registrationDeadline ? new Date(run.registrationDeadline) : null;
  return (
    <Link
      href={`/speedrun/${encodeURIComponent(run.slug)}`}
      className="group block rounded-3xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-6 sm:p-8 hover:border-red-500/70 transition-all"
    >
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Live Now
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">
          {run.monthLabel}
        </span>
      </div>
      <h3
        className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-4"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
      >
        {run.theme || "THEME TBA"}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {closeDate && (
          <RunFact
            icon={<Calendar className="w-4 h-4" />}
            label="Reg closes"
            value={closeDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          />
        )}
        {run.prizePool && (
          <RunFact icon={<Trophy className="w-4 h-4" />} label="Prize" value={run.prizePool} />
        )}
        <RunFact
          icon={<Users className="w-4 h-4" />}
          label="Registered"
          value={`${run._count?.registrations ?? 0}`}
        />
      </div>
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 group-hover:gap-3 transition-all">
        See run page
        <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

function PastRunCard({ run }: { run: PublicRun }) {
  return (
    <Link
      href={`/speedrun/${encodeURIComponent(run.slug)}`}
      className="group block rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 hover:border-red-500/40 transition-all"
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 mb-2">
        {run.monthLabel}
      </p>
      <h3 className="font-black italic tracking-tight text-xl text-black dark:text-white mb-2 group-hover:text-red-500 transition-colors">
        {run.theme || "Run"}
      </h3>
      <p className="text-xs text-zinc-500 mb-4">
        {run._count?.projects ?? 0} project{run._count?.projects === 1 ? "" : "s"}
      </p>
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-red-500 transition-colors">
        View
        <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  );
}

function RunFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-zinc-950/60">
      <div className="text-red-500">{icon}</div>
      <div className="leading-tight min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">{label}</div>
        <div className="text-sm font-bold text-black dark:text-white truncate">{value}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════ */

function FaqSection() {
  return (
    <section className="relative py-16 md:py-24 border-t border-black/5 dark:border-white/5" id="faq">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">FAQ</p>
          <h2
            className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white"
            style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
          >
            ANSWERS<br />UP FRONT.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultFaq.map((item) => (
            <article
              key={item.q}
              className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5"
            >
              <h3 className="font-black uppercase tracking-wider text-sm text-red-500 mb-2">
                {item.q}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-6">
          Each run can publish its own per-month FAQ on the run page.
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   JoinButton
   ═══════════════════════════════════════════ */

function JoinButton({
  phase,
  onClick,
  variant,
  hasRun,
}: {
  phase: RegState["phase"];
  onClick: () => void;
  variant: "primary" | "inverse" | "text";
  hasRun: boolean;
}) {
  const label = !hasRun
    ? "Coming Soon"
    : phase === "auth-registered"
    ? "Your Registration"
    : phase === "auth-not-registered"
    ? "Register"
    : "Join the Run";
  const Icon =
    phase === "loading"
      ? Loader2
      : phase === "auth-registered"
      ? CheckCircle2
      : ArrowRight;
  const iconClass =
    phase === "loading"
      ? "w-4 h-4 animate-spin"
      : "w-4 h-4 transition-transform group-hover:translate-x-0.5";
  const disabled = phase === "loading" || !hasRun;

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors disabled:opacity-60"
      >
        {label}
        <Icon className={iconClass.replace("w-4 h-4", "w-3.5 h-3.5")} />
      </button>
    );
  }
  if (variant === "inverse") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white text-red-500 font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {label}
        <Icon className={iconClass} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
      <Icon className={iconClass} />
    </button>
  );
}

/* ═══════════════════════════════════════════
   Refer (unchanged)
   ═══════════════════════════════════════════ */

function ReferSection({
  isAuthenticated,
  onSignInClick,
}: {
  isAuthenticated: boolean;
  onSignInClick: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [clicks, setClicks] = useState<number>(0);
  const [conversions, setConversions] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch("/api/speedrun/referrals/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.code) {
          setCode(data.code);
          setClicks(data.clicks || 0);
          setConversions(data.conversions || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const link = code && origin ? `${origin}/r/${code}` : "";

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="relative py-16 md:py-24 border-t border-black/5 dark:border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">
            Refer & Earn Rep
          </p>
          <h2
            className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-4"
            style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
          >
            BRING YOUR<br />SQUAD.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Share your unique referral link. Track every click and every signup that came from you.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="relative max-w-2xl mx-auto rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6 md:p-8 text-center overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-2">
                Sign in to get your link
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-md mx-auto">
                Each builder gets a unique referral link with click + conversion tracking.
              </p>
              <button
                onClick={onSignInClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 transition-all"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative max-w-2xl mx-auto rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6 md:p-8 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Your Referral Link
                  </p>
                  <p className="text-xs text-zinc-500">
                    Share anywhere — every click and signup is tracked.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <input
                  readOnly
                  value={loading ? "Loading..." : link}
                  className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white font-mono truncate focus:outline-none focus:border-red-500/50"
                />
                <button
                  onClick={copyLink}
                  disabled={!link || loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReferStat icon={<Eye className="w-4 h-4" />} label="Clicks" value={clicks} />
                <ReferStat icon={<Users className="w-4 h-4" />} label="Signups" value={conversions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ReferStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-red-500/15 bg-white dark:bg-zinc-950 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">
        {icon}
        {label}
      </div>
      <div className="font-black italic tracking-tighter text-3xl sm:text-4xl text-black dark:text-white leading-none tabular-nums">
        {value}
      </div>
    </div>
  );
}
