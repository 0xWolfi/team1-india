"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  UserPlus,
  User,
  Hash,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";

const TECH_OPTIONS = [
  "Solidity",
  "TypeScript / JS",
  "Python",
  "Rust",
  "Go",
  "Mobile (iOS/Android)",
  "AI / ML",
  "Design / UI",
  "Smart Contracts",
  "Full-stack",
  "Other",
];

const ROLE_OPTIONS = ["Builder", "Designer", "Product", "Other"];
const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "First few projects" },
  { value: "intermediate", label: "Intermediate", desc: "Shipped a few products" },
  { value: "advanced", label: "Advanced", desc: "Years of building" },
];

type TeamMode = "solo" | "create" | "join";

interface FormState {
  fullName: string;
  phone: string;
  city: string;
  twitterHandle: string;
  githubHandle: string;
  primaryRole: string;
  techStack: string[];
  experience: string;
  teamMode: TeamMode;
  teamName: string;
  teamCode: string;
  trackPreference: string;
  projectIdea: string;
  whyJoin: string;
  consent: boolean;
}

const INITIAL_FORM: FormState = {
  fullName: "",
  phone: "",
  city: "",
  twitterHandle: "",
  githubHandle: "",
  primaryRole: "",
  techStack: [],
  experience: "",
  teamMode: "solo",
  teamName: "",
  teamCode: "",
  trackPreference: "",
  projectIdea: "",
  whyJoin: "",
  consent: false,
};

interface TeamPreview {
  name: string;
  code: string;
  captainEmail: string;
  memberCount: number;
  isFull: boolean;
}

export default function RegisterClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    teamCode: string | null;
    teamName: string | null;
    runLabel: string;
  } | null>(null);

  const [teamPreview, setTeamPreview] = useState<TeamPreview | null>(null);
  const [teamLookupError, setTeamLookupError] = useState<string | null>(null);
  const [teamLookupLoading, setTeamLookupLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auth gate: open the same login modal /public uses, with a delay (mirrors /public exactly).
  // Stash the desired post-login destination so /public forwards us back here.
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  useEffect(() => {
    if (status === "unauthenticated") {
      try {
        sessionStorage.setItem("postLoginRedirect", "/speedrun/register");
      } catch {}
      const t = setTimeout(() => setLoginModalOpen(true), 300);
      return () => clearTimeout(t);
    }
    setLoginModalOpen(false);
  }, [status]);

  // Prefill name from session once it's available
  useEffect(() => {
    if (session?.user?.name && !form.fullName) {
      setForm((f) => ({ ...f, fullName: session.user!.name || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  // Redirect to status page if already registered
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/speedrun/registrations/my")
      .then((r) => r.json())
      .then((data) => {
        if (data.registered) router.replace("/speedrun/registration");
      })
      .catch(() => {});
  }, [status, router]);

  // Debounced team-code lookup
  useEffect(() => {
    if (form.teamMode !== "join") {
      setTeamPreview(null);
      setTeamLookupError(null);
      return;
    }
    const code = form.teamCode.trim().toUpperCase();
    if (code.length < 6) {
      setTeamPreview(null);
      setTeamLookupError(null);
      return;
    }
    setTeamLookupLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/speedrun/teams/lookup?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (res.ok && data.found) {
          setTeamPreview(data.team);
          setTeamLookupError(null);
        } else {
          setTeamPreview(null);
          setTeamLookupError("No team found with that code");
        }
      } catch {
        setTeamPreview(null);
        setTeamLookupError("Lookup failed — try again");
      } finally {
        setTeamLookupLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.teamCode, form.teamMode]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function toggleTech(t: string) {
    setForm((f) => ({
      ...f,
      techStack: f.techStack.includes(t) ? f.techStack.filter((x) => x !== t) : [...f.techStack, t],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Client-side validation
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.primaryRole) return setError("Pick your primary role");
    if (!form.experience) return setError("Pick your experience level");
    if (!form.consent) return setError("You must accept the code of conduct");
    if (form.teamMode === "create" && !form.teamName.trim()) {
      return setError("Team name is required when creating a team");
    }
    if (form.teamMode === "join" && !teamPreview) {
      return setError("Enter a valid team code to join");
    }

    setSubmitting(true);

    // Pull any referral attribution stashed on /speedrun (?ref=, utm_*)
    let referralCode: string | null = null;
    let utmSource: string | null = null;
    let utmMedium: string | null = null;
    let utmCampaign: string | null = null;
    try {
      referralCode = sessionStorage.getItem("speedrunRef");
      utmSource = sessionStorage.getItem("speedrunUtmSource");
      utmMedium = sessionStorage.getItem("speedrunUtmMedium");
      utmCampaign = sessionStorage.getItem("speedrunUtmCampaign");
    } catch {}

    try {
      const res = await fetch("/api/speedrun/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          referralCode,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      setSuccess({
        teamCode: data.teamCode,
        teamName: data.registration?.team?.name ?? null,
        runLabel: data.registration?.run?.monthLabel ?? "the next Speedrun",
      });
      try {
        sessionStorage.removeItem("speedrunRef");
        sessionStorage.removeItem("speedrunUtmSource");
        sessionStorage.removeItem("speedrunUtmMedium");
        sessionStorage.removeItem("speedrunUtmCampaign");
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  function copyTeamCode() {
    if (!success?.teamCode) return;
    navigator.clipboard.writeText(success.teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Loading state
  if (status === "loading") {
    return (
      <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white">
        <FloatingNav />
        <div className="pt-32 px-6 text-center text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          Loading...
        </div>
      </main>
    );
  }

  // Auth gate: not signed in → use the EXACT same pattern /public uses.
  // PublicLoginModal calls signIn() with callbackUrl="/public", so after sign-in
  // the user lands on /public — they can navigate back to Speedrun from there.
  // This is the proven path that works for everyone.
  if (status === "unauthenticated") {
    return (
      <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white">
        <FloatingNav />
        <PublicLoginModal
          isOpen={loginModalOpen}
          onClose={() => {
            setLoginModalOpen(false);
            router.push("/speedrun");
          }}
        />
        <div className="pt-32 px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">
            Sign in required
          </p>
          <h1
            className="font-black italic tracking-tighter leading-[0.9] text-black dark:text-white mb-4"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            ONE STEP AWAY.
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-8">
            Sign in with Google to register for the next Speedrun. After sign-in
            you'll come back here automatically.
          </p>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 transition-all"
          >
            Sign in to Register
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    );
  }

  // ===== Success State =====
  if (success) {
    return (
      <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
        <FloatingNav />

        <section className="relative pt-28 sm:pt-36 pb-24">
          <div
            className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-red-500 text-white mb-6 shadow-[0_0_60px_rgba(239,68,68,0.5)]"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">
              You're In
            </p>
            <h1
              className="font-black italic tracking-tighter leading-[0.9] text-black dark:text-white mb-4"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              REGISTERED FOR<br />
              <span className="text-red-500">{success.runLabel}</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
              You'll get an email when the theme drops. In the meantime, get your team ready.
            </p>

            {success.teamCode && (
              <div className="relative max-w-md mx-auto rounded-2xl border border-red-500/30 bg-red-500/5 p-5 sm:p-6 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">
                  Your Team Code{success.teamName ? ` · ${success.teamName}` : ""}
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="font-black italic tracking-tighter text-black dark:text-white text-3xl sm:text-4xl">
                    {success.teamCode}
                  </span>
                  <button
                    onClick={copyTeamCode}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                    title="Copy code"
                    type="button"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Share this code with your teammates — they enter it on the registration form to join your team.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/speedrun/registration"
                className="inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all"
              >
                View My Registration
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/speedrun"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-black/10 dark:border-white/10 text-black dark:text-white font-bold text-sm uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Back to Speedrun
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // ===== Form =====
  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <FloatingNav />

      {/* Header */}
      <section className="relative pt-28 sm:pt-36 pb-8 sm:pb-12 overflow-hidden">
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

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">
            Register
          </p>
          <h1
            className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-4"
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
          >
            JOIN THE<br />SPRINT.
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
            Tell us who you are and how you want to build. Takes about 2 minutes.
          </p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pb-24 space-y-6 sm:space-y-8">
        {/* ── Personal ── */}
        <FormCard title="About You" subtitle="The basics — who you are and where to reach you.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name *">
              <Input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Aarav Sharma"
                required
              />
            </Field>
            <Field label="Email">
              <Input value={session?.user?.email || ""} disabled />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 98765 43210"
                type="tel"
              />
            </Field>
            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Bengaluru"
              />
            </Field>
            <Field label="X / Twitter handle">
              <Input
                value={form.twitterHandle}
                onChange={(e) => update("twitterHandle", e.target.value)}
                placeholder="@yourhandle"
              />
            </Field>
            <Field label="GitHub handle">
              <Input
                value={form.githubHandle}
                onChange={(e) => update("githubHandle", e.target.value)}
                placeholder="@yourhandle"
              />
            </Field>
          </div>
        </FormCard>

        {/* ── Skills ── */}
        <FormCard title="Your Build Profile" subtitle="What you do and how deep you go.">
          <Field label="Primary role *">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <PillButton
                  key={r}
                  active={form.primaryRole === r}
                  onClick={() => update("primaryRole", r)}
                >
                  {r}
                </PillButton>
              ))}
            </div>
          </Field>
          <Field label="Tech stack (pick all that apply)">
            <div className="flex flex-wrap gap-2">
              {TECH_OPTIONS.map((t) => (
                <PillButton
                  key={t}
                  active={form.techStack.includes(t)}
                  onClick={() => toggleTech(t)}
                  small
                >
                  {t}
                </PillButton>
              ))}
            </div>
          </Field>
          <Field label="Experience level *">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("experience", opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.experience === opt.value
                      ? "border-red-500 bg-red-500/10 text-black dark:text-white"
                      : "border-black/10 dark:border-white/10 hover:border-red-500/40 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="font-black uppercase tracking-wider text-sm mb-1">{opt.label}</div>
                  <div className="text-xs text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </Field>
        </FormCard>

        {/* ── Team ── */}
        <FormCard title="Team" subtitle="Solo run, lead a squad, or join an existing one.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <TeamModeOption
              active={form.teamMode === "solo"}
              icon={<User className="w-5 h-5" />}
              title="Solo"
              desc="Build alone"
              onClick={() => update("teamMode", "solo")}
            />
            <TeamModeOption
              active={form.teamMode === "create"}
              icon={<UserPlus className="w-5 h-5" />}
              title="Create Team"
              desc="Get a code, invite mates"
              onClick={() => update("teamMode", "create")}
            />
            <TeamModeOption
              active={form.teamMode === "join"}
              icon={<Hash className="w-5 h-5" />}
              title="Join Team"
              desc="Use a teammate's code"
              onClick={() => update("teamMode", "join")}
            />
          </div>

          {form.teamMode === "create" && (
            <Field label="Team name *">
              <Input
                value={form.teamName}
                onChange={(e) => update("teamName", e.target.value)}
                placeholder="The Marble Builders"
                required
              />
              <p className="text-xs text-zinc-500 mt-2">
                You'll get a unique team code after submitting — share it with your teammates.
              </p>
            </Field>
          )}

          {form.teamMode === "join" && (
            <Field label="Team code *">
              <div className="relative">
                <Input
                  value={form.teamCode}
                  onChange={(e) => update("teamCode", e.target.value.toUpperCase())}
                  placeholder="TM-XXXXXX"
                  className="pr-10 uppercase tracking-widest"
                />
                {teamLookupLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-400" />
                )}
              </div>
              {teamPreview && (
                <div className="mt-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-black dark:text-white">{teamPreview.name}</div>
                    <div className="text-zinc-500">
                      Captain: {teamPreview.captainEmail} · {teamPreview.memberCount} member
                      {teamPreview.memberCount === 1 ? "" : "s"}
                      {teamPreview.isFull && " · Full"}
                    </div>
                  </div>
                </div>
              )}
              {teamLookupError && form.teamCode.length >= 6 && !teamLookupLoading && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{teamLookupError}</div>
                </div>
              )}
            </Field>
          )}

          {form.teamMode === "solo" && (
            <p className="text-xs text-zinc-500 leading-relaxed">
              <Users className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              You can still find a team later in the community channel.
            </p>
          )}
        </FormCard>

        {/* ── Project ── */}
        <FormCard title="Tell Us More (Optional)" subtitle="Anything you'd like the judges to know.">
          <Field label="Track preference">
            <Input
              value={form.trackPreference}
              onChange={(e) => update("trackPreference", e.target.value)}
              placeholder="DeFi / Infrastructure / Consumer / Open"
            />
          </Field>
          <Field label="Project idea">
            <Textarea
              value={form.projectIdea}
              onChange={(e) => update("projectIdea", e.target.value)}
              placeholder="What are you thinking of building?"
              rows={3}
            />
          </Field>
          <Field label="Why join Speedrun?">
            <Textarea
              value={form.whyJoin}
              onChange={(e) => update("whyJoin", e.target.value)}
              placeholder="One or two lines about what you're hoping to get out of this."
              rows={3}
            />
          </Field>
        </FormCard>

        {/* ── Consent + Submit ── */}
        <div className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6">
          <label className="flex items-start gap-3 cursor-pointer mb-5">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update("consent", e.target.checked)}
              className="mt-1 w-4 h-4 accent-red-500"
            />
            <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              I agree to the Speedrun code of conduct and understand my project details may be shared
              with sponsors for judging and amplification.
            </span>
          </label>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-500">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Registration
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <Footer />
    </main>
  );
}

/* ── Subcomponents ── */

function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6 md:p-8">
      <div className="mb-6">
        <h2 className="font-black italic tracking-tight text-xl sm:text-2xl text-black dark:text-white">
          {title}
        </h2>
        {subtitle && <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 transition-all resize-y ${className}`}
    />
  );
}

function PillButton({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"} rounded-lg border font-semibold transition-all ${
        active
          ? "border-red-500 bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)]"
          : "border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-red-500/40 hover:text-black dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function TeamModeOption({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left transition-all ${
        active
          ? "border-red-500 bg-red-500/10 text-black dark:text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          : "border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-red-500/40"
      }`}
    >
      <div
        className={`inline-flex w-9 h-9 items-center justify-center rounded-lg mb-2 ${
          active ? "bg-red-500 text-white" : "bg-black/5 dark:bg-white/5 text-red-500"
        }`}
      >
        {icon}
      </div>
      <div className="font-black uppercase tracking-wider text-sm">{title}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
      {active && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
          <Check className="w-3 h-3" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
