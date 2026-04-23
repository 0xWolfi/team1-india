import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js Middleware
 *
 * - Adds a unique request ID header for tracing
 * - 2FA enforcement (feature-flagged via ENABLE_2FA env var)
 * - CORE users without 2FA → forced to /auth/setup-2fa
 * - Users with 2FA enabled but not verified → forced to /auth/verify-2fa
 *
 * Security headers are already handled in next.config.ts.
 * Rate limiting is handled per-route via lib/rate-limit.ts.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add request ID for tracing/debugging
  response.headers.set("x-request-id", crypto.randomUUID());

  // 2FA enforcement (only when feature flag is enabled)
  if (process.env.ENABLE_2FA === "true") {
    const { pathname } = request.nextUrl;

    // Skip 2FA checks for API routes, auth routes, static assets, and public pages
    const skip2FAPaths = [
      "/api/",
      "/auth/",
      "/public",
      "/_next",
      "/offline",
      "/icon",
      "/manifest",
      "/robots",
      "/sitemap",
      "/pwa-icons",
    ];
    const shouldCheck = !skip2FAPaths.some((p) => pathname.startsWith(p));

    if (shouldCheck) {
      try {
        const token = await getToken({ req: request });

        if (token) {
          // CORE users must have 2FA enabled
          if (token.role === "CORE" && !token.twoFactorEnabled) {
            if (!pathname.startsWith("/auth/setup-2fa")) {
              return NextResponse.redirect(new URL("/auth/setup-2fa", request.url));
            }
          }

          // Users with 2FA enabled must verify after login
          if (token.twoFactorEnabled && !token.twoFactorVerified) {
            if (!pathname.startsWith("/auth/verify-2fa")) {
              return NextResponse.redirect(new URL("/auth/verify-2fa", request.url));
            }
          }
        }
      } catch {
        // Token parse failure — don't block, just continue
      }
    }
  }

  return response;
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|push-sw.js|manifest|robots.txt|sitemap.xml).*)",
  ],
};
