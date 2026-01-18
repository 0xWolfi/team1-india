import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DB-backed Rate Limiter using Prisma
 * Works in Serverless environments (Vercel)
 */

/**
 * Rate limit check
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
    
    if (ip === 'unknown') {
        // Fallback for local/dev if headers missing, though risky in prod
        // In prod, Next.js usually provides these.
    }

    const key = `rate_limit:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
        // Clean up old entries (Lazy cleanup on write)
        // Optimization: Do this rarely or rely on Cron, but for now strict safety:
        // Or better: Upsert logic.
        
        let record = await prisma.rateLimit.findUnique({ where: { key } });

        // If no record or expired, reset
        if (!record || Number(record.resetAt) < now) {
            record = await prisma.rateLimit.upsert({
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
                resetAt: Number(record.resetAt)
            };
        }

        // Check limit
        if (record.count >= limit) {
             return {
                allowed: false,
                remaining: 0,
                resetAt: Number(record.resetAt)
            };
        }

        // Increment
        record = await prisma.rateLimit.update({
            where: { key },
            data: { count: { increment: 1 } }
        });

        return {
            allowed: true,
            remaining: Math.max(0, limit - record.count),
            resetAt: Number(record.resetAt)
        };

    } catch (error) {
        console.error("Rate Limit Error:", error);
        // Fail open (allow) if DB is down, to avoid blocking legit users during outage
        // But log critical error
        return { allowed: true, remaining: 1, resetAt: now + windowMs };
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
