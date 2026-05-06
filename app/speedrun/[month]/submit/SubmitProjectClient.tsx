"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Github,
  Youtube,
  Twitter,
  ExternalLink,
} from "lucide-react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

interface RunData {
  id: string;
  slug: string;
  monthLabel: string;
  status: string;
  tracks: { id: string; name: string }[];
}

export default function SubmitProjectClient({ runSlug }: { runSlug: string }) {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [run, setRun] = useState<RunData | null>(null);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    coverImage: "",
    demoUrl: "",
    repoUrl: "",
    videoUrl: "",
    socialPostUrl: "",
    techStack: "",
    trackId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [runRes, myRes] = await Promise.all([
          fetch(`/api/speedrun/runs/${encodeURIComponent(runSlug)}/public`, { cache: "no-store" }),
          authStatus === "authenticated"
            ? fetch(`/api/speedrun/runs/${encodeURIComponent(runSlug)}/my-registration`)
            : Promise.resolve(null),
        ]);
        if (!runRes.ok) {
          const body = await runRes.json().catch(() => ({}));
          throw new Error(body.error || "Run not found");
        }
        const runData = await runRes.json();
        setRun(runData.run);
        if (myRes) {
          const myData = await myRes.json();
          setRegistered(!!myData.registered);
        } else {
          setRegistered(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [runSlug, authStatus]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!form.title.trim()) return setError("Project title is required");
    if (!run) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          coverImage: form.coverImage.trim() || null,
          demoUrl: form.demoUrl.trim() || null,
          repoUrl: form.repoUrl.trim() || null,
          videoUrl: form.videoUrl.trim() || null,
          socialPostUrl: form.socialPostUrl.trim() || null,
          techStack: form.techStack
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          tags: ["speedrun", `speedrun:${run.slug}`],
          speedrunRunId: run.id,
          speedrunTrackId: form.trackId || undefined,
          status: "published",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit project");
        return;
      }
      router.push(`/public/projects/${encodeURIComponent(data.project.slug)}`);
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (authStatus === "loading" || loading) {
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

  if (authStatus === "unauthenticated") {
    return (
      <Wrapper>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-2">Sign in required</p>
        <h1 className="font-black italic tracking-tighter text-3xl mb-4">Sign in to submit your project.</h1>
        <Link
          href={`/speedrun/${encodeURIComponent(runSlug)}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
        >
          Back to Run
        </Link>
      </Wrapper>
    );
  }

  if (!run || error) {
    return (
      <Wrapper>
        <h1 className="font-black italic tracking-tighter text-3xl mb-4">Run not found</h1>
        <p className="text-sm text-zinc-500 mb-6">{error}</p>
        <Link
          href="/speedrun"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
        >
          Back to Speedrun
        </Link>
      </Wrapper>
    );
  }

  if (!registered) {
    return (
      <Wrapper>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-2">
          {run.monthLabel}
        </p>
        <h1 className="font-black italic tracking-tighter text-3xl mb-4">Register first to submit.</h1>
        <p className="text-sm text-zinc-500 mb-6">You need to be registered for this run before you can submit a project.</p>
        <Link
          href={`/speedrun/${encodeURIComponent(runSlug)}/register`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
        >
          Register Now
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Wrapper>
    );
  }

  if (run.status !== "submissions_open") {
    return (
      <Wrapper>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-2">
          {run.monthLabel}
        </p>
        <h1 className="font-black italic tracking-tighter text-3xl mb-4">Submissions aren&apos;t open.</h1>
        <p className="text-sm text-zinc-500 mb-6">
          The submission portal opens once the build window starts. We&apos;ll notify you.
        </p>
        <Link
          href={`/speedrun/${encodeURIComponent(runSlug)}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"
        >
          Back to Run
        </Link>
      </Wrapper>
    );
  }

  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <FloatingNav />

      <section className="relative pt-28 sm:pt-36 pb-12 overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <Link
            href={`/speedrun/${encodeURIComponent(runSlug)}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Run
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-3">
            Submit · {run.monthLabel}
          </p>
          <h1
            className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-3"
            style={{ fontSize: "clamp(2.25rem, 7vw, 5rem)" }}
          >
            SHIP IT.
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
            Submit your project for this Speedrun. You can edit later — every save is versioned.
          </p>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pb-24 space-y-6"
      >
        <Card title="The Pitch" subtitle="Title and a one-paragraph description.">
          <Field label="Project title *">
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="The thing you built"
              required
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              placeholder="What does it do, who is it for, why does it matter?"
            />
          </Field>
          {run.tracks.length > 0 && (
            <Field label="Track">
              <Select value={form.trackId} onChange={(v) => update("trackId", v)}>
                <option value="">— pick a track —</option>
                {run.tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </Card>

        <Card title="Media" subtitle="Cover image + screenshots are optional but recommended.">
          <Field label="Cover image URL">
            <Input
              value={form.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </Card>

        <Card title="Links" subtitle="Anywhere we should send the judges.">
          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Live demo URL
              </span>
            }
          >
            <Input
              value={form.demoUrl}
              onChange={(e) => update("demoUrl", e.target.value)}
              placeholder="https://your-app.com"
            />
          </Field>
          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub repo
              </span>
            }
          >
            <Input
              value={form.repoUrl}
              onChange={(e) => update("repoUrl", e.target.value)}
              placeholder="https://github.com/..."
            />
          </Field>
          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5" /> Demo video
              </span>
            }
          >
            <Input
              value={form.videoUrl}
              onChange={(e) => update("videoUrl", e.target.value)}
              placeholder="https://youtu.be/..."
            />
          </Field>
          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5" /> X post URL
              </span>
            }
          >
            <Input
              value={form.socialPostUrl}
              onChange={(e) => update("socialPostUrl", e.target.value)}
              placeholder="https://x.com/yourhandle/status/..."
            />
          </Field>
        </Card>

        <Card title="Tech" subtitle="Comma-separated. Helps with judging and discovery.">
          <Input
            value={form.techStack}
            onChange={(e) => update("techStack", e.target.value)}
            placeholder="TypeScript, Solidity, Next.js"
          />
        </Card>

        <div className="rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-500">{error}</div>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Submit Project
              </>
            )}
          </button>
        </div>
      </form>

      <Footer />
    </main>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white">
      <FloatingNav />
      <div className="pt-32 px-6 text-center max-w-lg mx-auto">{children}</div>
    </main>
  );
}

function Card({
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
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
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
      className={`w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 transition-all ${className}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 transition-all resize-y ${className}`}
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white focus:outline-none focus:border-red-500/50"
    >
      {children}
    </select>
  );
}
