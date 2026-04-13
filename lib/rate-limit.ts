import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DB-backed Rate Limiter using Prisma
 * Works in Serverless environments (Vercel)
 *
 * Uses atomic conditional updates to prevent TOCTOU race conditions.
 * Fails CLOSED on DB errors (rejects request) for security.
 */

/**
 * Rate limit check — atomic, race-safe
 * @param request - Next.js request object
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export async function checkRateLimit(
    request: NextRequest,
    limit: number = 10,
    windowMs: number = 60 * 1000 // 1 minute default
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const key = `rate_limit:${ip}`;
    const now = Date.now();

    try {
        // Step 1: Try atomic increment within the current window
        // This only succeeds if: record exists AND window hasn't expired AND count < limit
        const incremented = await prisma.rateLimit.updateMany({
            where: {
                key,
                resetAt: { gt: BigInt(now) },
                count: { lt: limit },
            },
            data: { count: { increment: 1 } }
        });

        if (incremented.count > 0) {
            // Successfully incremented within limits
            const record = await prisma.rateLimit.findUnique({ where: { key } });
            return {
                allowed: true,
                remaining: Math.max(0, limit - (record?.count ?? limit)),
                resetAt: Number(record?.resetAt ?? now + windowMs)
            };
        }

        // Step 2: updateMany matched 0 rows. Either:
        // (a) no record exists yet, (b) window expired, or (c) count >= limit
        const existing = await prisma.rateLimit.findUnique({ where: { key } });

        // Case (a) or (b): no record or window expired — reset the counter
        if (!existing || Number(existing.resetAt) <= now) {
            await prisma.rateLimit.upsert({
                where: { key },
                update: {
                    count: 1,
                    resetAt: BigInt(now + windowMs)
                },
                create: {
                    key,
                    count: 1,
                    resetAt: BigInt(now + windowMs)
                }
            });
            return {
                allowed: true,
                remaining: limit - 1,
                resetAt: now + windowMs
            };
        }

        // Case (c): count >= limit and window hasn't expired — reject
        return {
            allowed: false,
            remaining: 0,
            resetAt: Number(existing.resetAt)
        };

    } catch (error) {
        console.error("Rate Limit Error:", error);
        // Fail CLOSED: reject request on DB error to prevent abuse during outages
        return { allowed: false, remaining: 0, resetAt: now + windowMs };
    }
}

/**
 * Rate limit middleware for API routes - ASYNC
 */
export function withRateLimit(
    limit: number = 10,
    windowMs: number = 60 * 1000
) {
    return async (request: NextRequest): Promise<Response | null> => {
        const result = await checkRateLimit(request, limit, windowMs);

        if (!result.allowed) {
            return new Response(
                JSON.stringify({
                    error: "Too many requests. Please try again later.",
                    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': result.remaining.toString(),
                        'X-RateLimit-Reset': result.resetAt.toString(),
                        'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        return null; // Continue with request
    };
}
