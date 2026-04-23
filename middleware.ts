import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * Next.js Middleware
 *
 * Runs on every request. Keeps it lightweight:
 * - Adds a unique request ID header for tracing
 * - Future: 2FA enforcement will be added here (Phase 2FA)
 *
 * Security headers are already handled in next.config.ts.
 * Rate limiting is handled per-route via lib/rate-limit.ts.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add request ID for tracing/debugging
  const requestId = crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|push-sw.js|manifest|robots.txt|sitemap.xml).*)",
  ],
};
