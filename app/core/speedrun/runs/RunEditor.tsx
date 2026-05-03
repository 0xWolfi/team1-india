"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Star,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { MarkdownEditor } from "@/components/core/MarkdownEditor";
import { ALLOWED_TRACK_ICONS } from "@/lib/speedrun";

const STATUS_OPTIONS = [
  "upcoming",
  "registration_open",
  "submissions_open",
  "submissions_closed",
  "irl_event",
  "judging",
  "completed",
  "cancelled",
] as const;

// Single source of truth lives in lib/speedrun.ts so the server-side validator
// and the dropdown stay in sync.
const ICON_OPTIONS = ALLOWED_TRACK_ICONS;

interface TrackForm {
  id?: string;
  name: string;
  tagline: string;
  iconKey: string;
  description: string;
  sortOrder: number;
}

export interface RunFormState {
  slug: string;
  monthLabel: string;
  theme: string;
  themeDescription: string;
  status: (typeof STATUS_OPTIONS)[number];
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionOpenDate: string;
  irlEventDate: string;
  winnersDate: string;
  prizePool: string;
  hostCities: string;
  sponsorsMd: string;
  faqMd: string;
  tracks: TrackForm[];
}

export const EMPTY_RUN_FORM: RunFormState = {
  slug: "",
  monthLabel: "",
  theme: "",
  themeDescription: "",
  status: "upcoming",
  isCurrent: false,
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  submissionOpenDate: "",
  irlEventDate: "",
  winnersDate: "",
  prizePool: "",
  hostCities: "",
  sponsorsMd: "",
  faqMd: "",
  tracks: [],
};

/** Convert an ISO date or null to a YYYY-MM-DD string for <input type="date"> consumption. */
function isoToDateInput(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Format in UTC so timezone shifts don’t move the day around.
  return d.toISOString().slice(0, 10);
}

/** Convert a YYYY-MM-DD string to an ISO datetime (start-of-day UTC) or null. */
function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Convert markdown JSON-or-text round trip.
 * Sponsors and FAQ are stored as JSON in DB but edited as freeform markdown
 * here. We persist them as a single { md: "..." } object so the page renderer
 * can choose to either treat them as markdown or upgrade later to structured
 * data without a migration. Editor only ever sees a string.
 */
function jsonToMd(j: unknown): string {
  if (!j || typeof j !== "object") return "";
  const obj = j as Record<string, unknown>;
  return typeof obj.md === "string" ? obj.md : "";
}
function mdToJson(md: string): unknown {
  return md.trim() ? { md } : null;
}

/** Build a form state from an API run record. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromApiRun(run: any): RunFormState {
  return {
    slug: run.slug ?? "",
    monthLabel: run.monthLabel ?? "",
    theme: run.theme ?? "",
    themeDescription: run.themeDescription ?? "",
    status: STATUS_OPTIONS.includes(run.status) ? run.status : "upcoming",
    isCurrent: !!run.isCurrent,
    startDate: isoToDateInput(run.startDate),
    endDate: isoToDateInput(run.endDate),
    registrationDeadline: isoToDateInput(run.registrationDeadline),
    submissionOpenDate: isoToDateInput(run.submissionOpenDate),
    irlEventDate: isoToDateInput(run.irlEventDate),
    winnersDate: isoToDateInput(run.winnersDate),
    prizePool: run.prizePool ?? "",
    hostCities: Array.isArray(run.hostCities) ? run.hostCities.join(", ") : "",
    sponsorsMd: jsonToMd(run.sponsors),
    faqMd: jsonToMd(run.faq),
    tracks: Array.isArray(run.tracks)
      ? run.tracks.map(
          (
            t: {
              id?: string;
              name?: string;
              tagline?: string;
              iconKey?: string;
              description?: string;
              sortOrder?: number;
            },
            i: number
          ) => ({
            id: t.id,
            name: t.name ?? "",
            tagline: t.tagline ?? "",
            iconKey: t.iconKey ?? "",
            description: t.description ?? "",
            sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : i,
          })
        )
      : [],
  };
}

interface RunEditorProps {
  mode: "create" | "edit";
  initial: RunFormState;
  /** Original slug before edits — used to PATCH the right record on rename. */
  originalSlug?: string;
}

export function RunEditor({ mode, initial, originalSlug }: RunEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<RunFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Keep form in sync if the parent reloads (e.g. after first save in edit mode).
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const dateOrder = useMemo(() => validateDateOrder(form), [form]);

  function update<K extends keyof RunFormState>(key: K, value: RunFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateTrack(idx: number, patch: Partial<TrackForm>) {
    setForm((f) => ({
      ...f,
      tracks: f.tracks.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    }));
  }

  function addTrack() {
    setForm((f) => ({
      ...f,
      tracks: [
        ...f.tracks,
        {
          name: "",
          tagline: "",
          iconKey: "",
          description: "",
          sortOrder: f.tracks.length,
        },
      ],
    }));
  }

  function removeTrack(idx: number) {
    setForm((f) => ({ ...f, tracks: f.tracks.filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (saving) return;
    setError(null);
    setSavedAt(null);

    if (!form.slug.trim() || !form.monthLabel.trim()) {
      setError("Slug and month label are required");
      return;
    }
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(form.slug)) {
      setError("Slug must be lowercase alphanumerics + hyphens (e.g. may-26)");
      return;
    }
    if (dateOrder) {
      setError(dateOrder);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        monthLabel: form.monthLabel.trim(),
        theme: form.theme.trim() || null,
        themeDescription: form.themeDescription || null,
        status: form.status,
        isCurrent: form.isCurrent,
        startDate: dateInputToIso(form.startDate),
        endDate: dateInputToIso(form.endDate),
        registrationDeadline: dateInputToIso(form.registrationDeadline),
        submissionOpenDate: dateInputToIso(form.submissionOpenDate),
        irlEventDate: dateInputToIso(form.irlEventDate),
        winnersDate: dateInputToIso(form.winnersDate),
        prizePool: form.prizePool.trim() || null,
        hostCities: form.hostCities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        sponsors: mdToJson(form.sponsorsMd),
        faq: mdToJson(form.faqMd),
      };

      let resultSlug = form.slug.trim();
      if (mode === "create") {
        const res = await fetch("/api/speedrun/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, tracks: form.tracks.filter((t) => t.name && t.tagline) }),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "Failed to create run");
          return;
        }
        resultSlug = body.run?.slug ?? resultSlug;
      } else {
        const res = await fetch(`/api/speedrun/runs/${encodeURIComponent(originalSlug || form.slug)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "Failed to update run");
          return;
        }
        resultSlug = body.run?.slug ?? resultSlug;

        // Sync tracks: PATCH existing + POST new + DELETE removed.
        await syncTracks(resultSlug, initial.tracks, form.tracks);
      }

      setSavedAt(Date.now());
      if (mode === "create") {
        router.push(`/core/speedrun/runs/${encodeURIComponent(resultSlug)}`);
      } else if (resultSlug !== originalSlug) {
        router.replace(`/core/speedrun/runs/${encodeURIComponent(resultSlug)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function setCurrent() {
    if (!confirm(`Promote "${form.slug}" as the current run? This unflags any other run.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/speedrun/runs/${encodeURIComponent(originalSlug || form.slug)}/set-current`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to set as current");
        return;
      }
      setForm((f) => ({ ...f, isCurrent: true }));
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/core/speedrun"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-500 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Speedrun
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-black italic tracking-tighter text-3xl text-black dark:text-white">
            {mode === "create" ? "New Run" : `Edit ${form.monthLabel || form.slug}`}
          </h1>
          {mode === "edit" && form.isCurrent && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest">
              <Star className="w-3 h-3" /> Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && !form.isCurrent && (
            <button
              type="button"
              onClick={setCurrent}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors disabled:opacity-60"
            >
              <Star className="w-3.5 h-3.5" />
              Set as Current
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : mode === "create" ? "Create Run" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {savedAt && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" /> Saved
        </div>
      )}

      {/* System fields */}
      <Card title="Run identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Slug *" hint="Lowercase, hyphenated. Becomes /speedrun/[slug].">
            <Input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value.toLowerCase())}
              placeholder="may-26"
            />
          </Field>
          <Field label="Month label *" hint="Display label, e.g. MAY 2026.">
            <Input
              value={form.monthLabel}
              onChange={(e) => update("monthLabel", e.target.value)}
              placeholder="MAY 2026"
            />
          </Field>
          <Field label="Theme" hint="Short theme name (e.g. Onchain Agents).">
            <Input
              value={form.theme}
              onChange={(e) => update("theme", e.target.value)}
              placeholder="Theme TBA"
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(v) => update("status", v as RunFormState["status"])}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prize pool" hint="Free text — e.g. $1500 across all tracks.">
            <Input
              value={form.prizePool}
              onChange={(e) => update("prizePool", e.target.value)}
              placeholder="$1500 across all tracks"
            />
          </Field>
          <Field label="Host cities" hint="Comma-separated. Leave empty until announced.">
            <Input
              value={form.hostCities}
              onChange={(e) => update("hostCities", e.target.value)}
              placeholder="Bengaluru, Delhi"
            />
          </Field>
          {mode === "create" && (
            <Field label="Set as current immediately?" hint="Unflag any other current run.">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={(e) => update("isCurrent", e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm">Promote this run on save</span>
              </label>
            </Field>
          )}
        </div>
      </Card>

      {/* Dates */}
      <Card title="Dates" hint="Registration and submissions close together — that's the same date.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Run start (Day 1)">
            <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
          </Field>
          <Field label="Submissions open">
            <Input
              type="date"
              value={form.submissionOpenDate}
              onChange={(e) => update("submissionOpenDate", e.target.value)}
            />
          </Field>
          <Field label="Reg + submissions close *">
            <Input
              type="date"
              value={form.registrationDeadline}
              onChange={(e) => {
                update("registrationDeadline", e.target.value);
                update("endDate", e.target.value);
              }}
            />
          </Field>
          <Field label="IRL event">
            <Input
              type="date"
              value={form.irlEventDate}
              onChange={(e) => update("irlEventDate", e.target.value)}
            />
          </Field>
          <Field label="Winners announced">
            <Input
              type="date"
              value={form.winnersDate}
              onChange={(e) => update("winnersDate", e.target.value)}
            />
          </Field>
          <Field label="Run end" hint="Auto-set to close date by default.">
            <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
          </Field>
        </div>
        {dateOrder && <p className="mt-3 text-xs text-amber-500">{dateOrder}</p>}
      </Card>

      {/* Theme description */}
      <Card title="Theme description" hint="Markdown — appears at the top of /speedrun/[slug].">
        <MarkdownEditor
          value={form.themeDescription}
          onChange={(v) => update("themeDescription", v)}
          placeholder={THEME_TEMPLATE}
          rows={14}
        />
      </Card>

      {/* Sponsors */}
      <Card title="Sponsors" hint="Markdown — list logos/names, or leave empty for 'Sponsors TBA'.">
        <MarkdownEditor
          value={form.sponsorsMd}
          onChange={(v) => update("sponsorsMd", v)}
          placeholder={SPONSORS_TEMPLATE}
          rows={8}
        />
      </Card>

      {/* FAQ */}
      <Card title="FAQ" hint="Markdown — Q on a heading line, A in the paragraph below.">
        <MarkdownEditor
          value={form.faqMd}
          onChange={(v) => update("faqMd", v)}
          placeholder={FAQ_TEMPLATE}
          rows={10}
        />
      </Card>

      {/* Tracks */}
      <Card
        title="Tracks"
        hint="Each track is a focused lane builders compete in. Add icon names from lucide-react."
      >
        <div className="space-y-3">
          {form.tracks.map((t, i) => (
            <div
              key={t.id ?? `new-${i}`}
              className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/[0.02] dark:bg-white/[0.02]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <Field label="Name *">
                  <Input value={t.name} onChange={(e) => updateTrack(i, { name: e.target.value })} placeholder="DeFi" />
                </Field>
                <Field label="Icon">
                  <Select
                    value={t.iconKey}
                    onChange={(v) => updateTrack(i, { iconKey: v })}
                  >
                    <option value="">— pick icon —</option>
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Sort order">
                  <Input
                    type="number"
                    value={t.sortOrder}
                    onChange={(e) => updateTrack(i, { sortOrder: Number(e.target.value) || 0 })}
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeTrack(i)}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
              <Field label="Tagline *">
                <Input
                  value={t.tagline}
                  onChange={(e) => updateTrack(i, { tagline: e.target.value })}
                  placeholder="Build the next financial primitive."
                />
              </Field>
              <Field label="Description (markdown)" hint="Optional, longer detail for the run page.">
                <MarkdownEditor
                  value={t.description}
                  onChange={(v) => updateTrack(i, { description: v })}
                  rows={6}
                  defaultMode="edit"
                />
              </Field>
            </div>
          ))}
          <button
            type="button"
            onClick={addTrack}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-red-500/40 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add track
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Helpers ─── */

function validateDateOrder(f: RunFormState): string | null {
  const start = f.startDate ? new Date(f.startDate) : null;
  const subOpen = f.submissionOpenDate ? new Date(f.submissionOpenDate) : null;
  const close = f.registrationDeadline ? new Date(f.registrationDeadline) : null;
  const irl = f.irlEventDate ? new Date(f.irlEventDate) : null;
  const winners = f.winnersDate ? new Date(f.winnersDate) : null;

  if (start && subOpen && subOpen < start) return "Submissions can't open before run starts.";
  if (subOpen && close && close < subOpen) return "Close date must be on or after submissions open.";
  if (start && close && close < start) return "Close date must be on or after run start.";
  if (close && irl && irl < close) return "IRL event should be after submissions close.";
  if (irl && winners && winners < irl) return "Winners announcement should be after the IRL event.";
  return null;
}

async function syncTracks(slug: string, before: TrackForm[], after: TrackForm[]) {
  const beforeIds = new Set(before.map((t) => t.id).filter(Boolean) as string[]);
  const afterIds = new Set(after.map((t) => t.id).filter(Boolean) as string[]);

  // Deletes
  const toDelete = [...beforeIds].filter((id) => !afterIds.has(id));
  await Promise.all(
    toDelete.map((id) => fetch(`/api/speedrun/tracks/${id}`, { method: "DELETE" }))
  );

  // Updates and creates
  for (const t of after) {
    if (!t.name || !t.tagline) continue;
    const payload = {
      name: t.name.trim(),
      tagline: t.tagline.trim(),
      iconKey: t.iconKey || null,
      description: t.description || null,
      sortOrder: t.sortOrder || 0,
    };
    if (t.id) {
      await fetch(`/api/speedrun/tracks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/speedrun/runs/${encodeURIComponent(slug)}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  }
}

/* ─── Subcomponents ─── */

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-black uppercase tracking-wider text-sm text-black dark:text-white">{title}</h2>
        {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-zinc-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 transition-all ${className}`}
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
      className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm text-black dark:text-white focus:outline-none focus:border-red-500/50"
    >
      {children}
    </select>
  );
}

/* ─── Templates ─── */

const THEME_TEMPLATE = `# Theme name

One-paragraph pitch — what this month is about, who it's for.

## What we're looking for
- Ambitious builds
- Real users
- Working code

## What you'll build
2-3 sentences describing the kind of project that fits this month.`;

const SPONSORS_TEMPLATE = `## Sponsors

- **Sponsor name** — one-liner about what they bring
- **Sponsor name** — one-liner

_or_

Sponsors: TBA`;

const FAQ_TEMPLATE = `## Who can join?
Anyone — solo or in a duo.

## Solo or team?
Solo or duo (max 2). You can switch between solo and team anytime until submissions close.

## What's the prize?
$1500 across all tracks.

## When does the IRL event happen?
TBA — host cities announced based on traction.`;
