import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

interface DataLoadErrorProps {
  /** Short user-facing message — e.g. "We couldn't load this event." */
  title?: string;
  /** Optional explanatory paragraph. */
  description?: string;
  /**
   * Diagnostic detail surfaced only in non-production builds. In production
   * builds the prop is rendered but the page hides it via env check, so users
   * never see raw error text. Pass `error.message` here from the catch block.
   */
  detail?: string;
  /** Optional URL to send the user back to. Defaults to /public. */
  backHref?: string;
  backLabel?: string;
}

/**
 * Friendly error UI for server components that fail to load data (DB
 * unreachable, missing env vars at build/runtime, transient timeouts).
 *
 * Design intent:
 *   - Tell the user *something is up* without exposing infrastructure details.
 *   - Surface a back link so they aren't stuck.
 *   - In dev (NODE_ENV !== "production"), include the raw error message so the
 *     developer can debug without flipping logs.
 *
 * Used by detail pages (events/[id], programs/[id], etc.) and any future
 * server component that reads from the DB.
 */
export function DataLoadError({
  title = "Couldn't load this page",
  description = "Something went wrong while loading. Please try again in a moment.",
  detail,
  backHref = "/public",
  backLabel = "Back to home",
}: DataLoadErrorProps) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-5">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-3">
          {title}
        </h1>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">{description}</p>

        {isDev && detail && (
          <pre className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs text-left whitespace-pre-wrap break-words">
            <strong className="block mb-1 uppercase tracking-widest text-[10px]">
              Dev only
            </strong>
            {detail}
          </pre>
        )}

        <div className="inline-flex items-center gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:border-red-500/40 hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
          <a
            href="."
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </a>
        </div>
      </div>
    </main>
  );
}
