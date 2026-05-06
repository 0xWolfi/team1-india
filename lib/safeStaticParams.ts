/**
 * Helpers for build-time data fetches that should never crash the build.
 *
 * Pages with `generateStaticParams` call into Prisma at build time so Next.js
 * can pre-render every public path. If `DATABASE_URL` is unset or the DB is
 * unreachable (CI without DB, container builds, dev `bun run build`), this
 * call would throw and abort the entire build.
 *
 * Wrapping in `safeBuildFetch` returns `[]` instead — pages still build, just
 * without prerendered paths. Routes still work at runtime (they fall back to
 * on-demand rendering for the first request, then cache).
 */

/* eslint-disable no-console */
export async function safeBuildFetch<T>(
  fetcher: () => Promise<T[]>,
  context: string
): Promise<T[]> {
  try {
    return await fetcher();
  } catch (err) {
    // Log loudly during build so the operator knows prerendering was skipped.
    // We never re-throw — a missing DB at build is recoverable, the routes
    // will still render on demand at request time.
    console.warn(
      `[build] ${context} skipped — DB unreachable, prerender deferred to runtime.`,
      err instanceof Error ? err.message : err
    );
    return [];
  }
}
