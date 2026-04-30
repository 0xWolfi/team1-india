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
  Megaphone,
  Hammer,
  MapPin,
  Award,
  Loader2,
  Share2,
  Copy,
  Eye,
  Users,
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { HomeNavbar } from "@/components/website/HomeNavbar";
import { Footer } from "@/components/website/Footer";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";

/* ═══════════════════════════════════════════
   Data
   ═══════════════════════════════════════════ */

const whatCards = [
  {
    icon: Zap,
    title: "BUILD",
    desc: "Turn ideas into reality with speed and focus.",
  },
  {
    icon: Rocket,
    title: "SHIP",
    desc: "Deliver working products, not just presentations.",
  },
  {
    icon: Trophy,
    title: "COMPETE",
    desc: "Compete, learn and win exciting prizes.",
  },
];

const howSteps = [
  {
    n: "01",
    icon: UserPlus,
    title: "REGISTER",
    desc: "Sign up, choose your track and get ready.",
  },
  {
    n: "02",
    icon: Code2,
    title: "BUILD FAST",
    desc: "Collaborate, build and ship your solution.",
  },
  {
    n: "03",
    icon: PlayCircle,
    title: "DEMO & WIN",
    desc: "Present your product and win exciting prizes.",
  },
];

const benefits = [
  "Work on real-world problems",
  "Learn from top builders",
  "Build your network",
  "Win prizes & recognition",
];

const weeklyCadence = [
  {
    week: "Week 1",
    icon: Megaphone,
    title: "Theme Drop + Build Start",
    bullets: [
      "Theme + sponsor stack announced on Day 1",
      "Submissions open",
      "Sponsor + Team1 virtual workshop",
      "Region-tracked registration begins",
    ],
  },
  {
    week: "Week 2",
    icon: Hammer,
    title: "Submission Window",
    bullets: [
      "Building continues",
      "Second sponsor workshop + co-learning",
      "Submissions close end of week",
      "Host cities announced based on traction",
    ],
  },
  {
    week: "Week 3",
    icon: MapPin,
    title: "Build Stations",
    bullets: [
      "Pitch events across selected host cities",
      "Shortlisted projects pitch live",
      "In-person judging by Team1 + sponsors",
    ],
  },
  {
    week: "Week 4",
    icon: Award,
    title: "Winners",
    bullets: [
      "Top 5 winners announced (Team1 jury)",
      "Sponsor track winners announced",
      "Recap published",
      "Theme handoff to next month",
    ],
  },
];

/* ═══════════════════════════════════════════
   Page
   ═══════════════════════════════════════════ */

type RegState =
  | { phase: "loading" }
  | { phase: "anon" }
  | { phase: "auth-not-registered" }
  | { phase: "auth-registered" };

export default function SpeedrunClient() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [regState, setRegState] = useState<RegState>({ phase: "loading" });

  // Auto-open login modal if redirected back here with ?login=1
  useEffect(() => {
    if (searchParams?.get("login") === "1" && status === "unauthenticated") {
      setShowLoginModal(true);
    }
  }, [searchParams, status]);

  // Capture ?ref=CODE (or ?utm_*) and stash for the register form to pick up
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

  // Resolve registration phase from session + my-registration check
  useEffect(() => {
    if (status === "loading") {
      setRegState({ phase: "loading" });
      return;
    }
    if (status === "unauthenticated") {
      setRegState({ phase: "anon" });
      return;
    }
    let cancelled = false;
    fetch("/api/speedrun/registrations/my")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRegState({
          phase: data.registered ? "auth-registered" : "auth-not-registered",
        });
      })
      .catch(() => {
        if (!cancelled) setRegState({ phase: "auth-not-registered" });
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  function handleJoinClick() {
    if (regState.phase === "anon") {
      // Stash where we want to land after sign-in. /public will read this and forward.
      try {
        sessionStorage.setItem("postLoginRedirect", "/speedrun/register");
      } catch {}
      setShowLoginModal(true);
    } else if (regState.phase === "auth-not-registered") {
      router.push("/speedrun/register");
    } else if (regState.phase === "auth-registered") {
      router.push("/speedrun/registration");
    }
  }

  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <HomeNavbar />
      <PublicLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* ── HERO ── */}
      <section className="relative pt-28 sm:pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden">
        {/* Grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Red speed-streaks decoration */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-[60%] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-red-500/20 via-red-500/5 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
          {/* Left: copy */}
          <div className="relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
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
              A high-energy sprint for builders, thinkers and doers. Build. Ship. Win.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <JoinButton phase={regState.phase} onClick={handleJoinClick} variant="primary" />

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5">
                <Calendar className="w-5 h-5 text-red-500" />
                <div className="leading-tight">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Next Run
                  </div>
                  <div className="text-base font-black tracking-tight text-black dark:text-white">
                    28.05.26
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: hero statue (transparent PNG cutout) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full aspect-square max-w-[520px] sm:max-w-[600px] mx-auto lg:max-w-none lg:aspect-auto lg:h-[640px] xl:h-[720px] lg:scale-110 lg:translate-x-6 xl:translate-x-10 z-0"
          >
            {/* Red glow behind statue */}
            <div
              className="absolute inset-0 blur-3xl scale-75"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(239,68,68,0.4), rgba(239,68,68,0.1) 45%, transparent 75%)",
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

      {/* ── WHAT IS SPEEDRUN ── */}
      <section id="about" className="relative py-16 md:py-24 scroll-mt-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
              Overview
            </p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-6"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
            >
              WHAT IS<br />SPEEDRUN?
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed mb-6">
              Speedrun is a time-boxed monthly challenge where builders come together to solve real problems, build real products and ship them fast.
            </p>
            <Link
              href="#tracks"
              className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors"
            >
              Learn More
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {whatCards.map((card) => (
              <div
                key={card.title}
                className="relative rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 hover:border-red-500/40 transition-all p-5 sm:p-6 group overflow-hidden"
              >
                {/* Card glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-red-500/10 blur-2xl group-hover:bg-red-500/25 transition-colors" />
                <div className="relative">
                  <div
                    className="inline-flex w-12 h-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 mb-4"
                    style={{ filter: "drop-shadow(0 0 12px rgba(239,68,68,0.4))" }}
                  >
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black tracking-wider text-red-500 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="tracks" className="relative py-16 md:py-24 scroll-mt-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 lg:gap-16">
          <div className="lg:max-w-xs">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
              Process
            </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative">
            {howSteps.map((step, i) => (
              <div key={step.n} className="relative text-center">
                {/* Outline number */}
                <p
                  className="font-black italic tracking-tighter leading-none text-transparent absolute -top-4 left-1/2 -translate-x-1/2 select-none whitespace-nowrap z-0"
                  style={{
                    WebkitTextStroke: "1.5px rgba(239,68,68,0.3)",
                    fontSize: "clamp(3rem, 7vw, 6rem)",
                  }}
                >
                  {step.n}
                </p>

                {/* Connector line (desktop) */}
                {i < howSteps.length - 1 && (
                  <div className="hidden sm:block absolute top-[5.25rem] left-[calc(50%+2rem)] right-[-50%] h-px bg-gradient-to-r from-red-500/60 to-red-500/10" />
                )}

                <div className="relative pt-12">
                  <div
                    className="relative z-10 mx-auto inline-flex w-14 h-14 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-4"
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black tracking-wider text-red-500 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[200px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WEEKLY CADENCE (FAQ-ish "How a month plays out") ── */}
      <section id="faq" className="relative py-16 md:py-24 scroll-mt-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
              Monthly Cadence
            </p>
            <h2
              className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-4"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
            >
              4 WEEKS.<br />ONE SPRINT.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Each Speedrun runs on a tight 4-week cadence. Theme drops on Day 1, builders ship by Week 2, IRL pitches in Week 3, and winners are crowned in Week 4.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyCadence.map((wk) => (
              <div
                key={wk.week}
                className="relative rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 hover:border-red-500/40 transition-all p-5 group overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-red-500/10 blur-2xl group-hover:bg-red-500/25 transition-colors" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="inline-flex w-10 h-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-500"
                      style={{ filter: "drop-shadow(0 0 10px rgba(239,68,68,0.4))" }}
                    >
                      <wk.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                      {wk.week}
                    </span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-black dark:text-white mb-3">
                    {wk.title}
                  </h3>
                  <ul className="space-y-2">
                    {wk.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY JOIN ── */}
      <section className="relative py-16 md:py-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
              Benefits
            </p>
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
                  <span className="text-sm sm:text-base font-semibold text-black dark:text-white">
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            <JoinButton phase={regState.phase} onClick={handleJoinClick} variant="text" />

          </div>

          <div className="relative w-full aspect-square max-w-[520px] sm:max-w-[600px] mx-auto lg:max-w-none lg:aspect-auto lg:h-[600px] xl:h-[680px]">
            <div
              className="absolute inset-0 blur-3xl scale-75"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(239,68,68,0.35), rgba(239,68,68,0.08) 50%, transparent 75%)",
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

      {/* ── WHY THIS MATTERS NOW (manifesto) ── */}
      <section className="relative py-16 md:py-24 border-t border-black/5 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
            The Mission
          </p>
          <h2
            className="font-black italic tracking-tighter leading-[0.95] text-black dark:text-white mb-8"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            WHY THIS<br />MATTERS NOW.
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            <p>
              Speedrun grows our builder community across cities while creating consistent usage of sponsor stacks.
            </p>
            <p>
              We nudge builders to post their projects on X and amplify them in return — they market the project, we market them. Growth becomes builder-led, not just us posting.
            </p>
            <p>
              Running this through summer positions us to walk into Devcon with proven traction — projects shipped, builders engaged, cities activated. That track record is what we use to land sponsors for our own event after Devcon.
            </p>
            <p className="text-black dark:text-white font-bold pt-2">
              In short: Speedrun is both the program — and the proof.
            </p>
          </div>
        </div>
      </section>

      {/* ── REFERRAL ── */}
      <ReferSection isAuthenticated={status === "authenticated"} onSignInClick={() => setShowLoginModal(true)} />

      {/* ── CTA BANNER ── */}
      <section className="relative bg-red-500 text-white py-16 md:py-24 overflow-hidden">
        {/* Grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Speed lines */}
        <div className="absolute inset-y-0 left-0 w-full pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-1/2 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-1/3 -right-20 w-1/2 h-1 bg-gradient-to-l from-transparent via-white/20 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2
            className="font-black italic tracking-tighter leading-[0.85] text-white mb-6"
            style={{ fontSize: "clamp(3rem, 12vw, 10rem)" }}
          >
            SPEEDRUN
          </h2>
          <p className="text-base sm:text-xl md:text-2xl font-bold uppercase tracking-wider mb-8">
            Are you ready to build at speed?
          </p>
          <JoinButton phase={regState.phase} onClick={handleJoinClick} variant="inverse" />
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ═══════════════════════════════════════════
   JoinButton — auth-gated CTA
   ═══════════════════════════════════════════ */

function JoinButton({
  phase,
  onClick,
  variant,
}: {
  phase: RegState["phase"];
  onClick: () => void;
  variant: "primary" | "inverse" | "text";
}) {
  const label =
    phase === "auth-registered"
      ? "View Registration"
      : phase === "auth-not-registered"
      ? "Register"
      : "Join Speedrun";

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

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={phase === "loading"}
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
        disabled={phase === "loading"}
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
      disabled={phase === "loading"}
      className="group inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
      <Icon className={iconClass} />
    </button>
  );
}

/* ═══════════════════════════════════════════
   ReferSection — share link + click/conversion stats
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
          <div className="relative max-w-xl mx-auto rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-6 sm:p-8 text-center">
            <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-2">
              Sign in to get your link
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5">
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
    <div className="rounded-xl border border-red-500/15 bg-white dark:bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">
        {icon}
        {label}
      </div>
      <div className="font-black italic tracking-tighter text-3xl sm:text-4xl text-black dark:text-white leading-none">
        {value}
      </div>
    </div>
  );
}
