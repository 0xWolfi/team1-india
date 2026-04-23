import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Higher-order function to add rate limiting to any API route handler.
 *
 * Usage:
 *   export const POST = withRateLimitHandler(10, 60000, async (request) => { ... });
 */
export function withRateLimitHandler(
  limit: number,
  windowMs: number,
  handler: (request: NextRequest, context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: any) => {
    const result = await checkRateLimit(request, limit, windowMs);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    return handler(request, context);
  };
}

/**
 * Validate payload size. Returns error response if too large, null if ok.
 */
export function checkPayloadSize(body: string, maxBytes = 51200): Response | null {
  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 }) as any;
  }
  return null;
}
