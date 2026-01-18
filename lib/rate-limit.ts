import { NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter
 * For production, use a distributed rate limiter like @upstash/ratelimit or Redis
 */
interface RateLimitStore {
    [key: string]: {
        count: number;
        resetAt: number;
    };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetAt < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);

/**
 * Rate limit check
 * @param request - Next.js request object
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
    request: NextRequest,
    limit: number = 10,
    windowMs: number = 60 * 1000 // 1 minute default
): { allowed: boolean; remaining: number; resetAt: number } {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';
    
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    
    const entry = store[key];
    
    if (!entry || entry.resetAt < now) {
        // Create new entry or reset expired entry
        store[key] = {
            count: 1,
            resetAt: now + windowMs
        };
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt: now + windowMs
        };
    }
    
    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt
        };
    }
    
    entry.count++;
    return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt
    };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
    limit: number = 10,
    windowMs: number = 60 * 1000
) {
    return (request: NextRequest): Response | null => {
        const result = checkRateLimit(request, limit, windowMs);
        
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
