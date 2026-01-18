import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth(authOptions);

// Wrap NextAuth handler with rate limiting for login attempts
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ nextauth: string[] }> }
) {
    // Only rate limit sign-in attempts (credentials or OAuth callbacks)
    const { nextauth } = await context.params;
    const isSignIn = nextauth?.[0] === "signin" || nextauth?.[0] === "callback";
    
    if (isSignIn) {
        // Rate limiting: 5 login attempts per 15 minutes per IP (prevents brute force)
        const rateLimitResponse = await withRateLimit(5, 15 * 60 * 1000)(req);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
    }
    
    // Call the original NextAuth handler
    return handler(req, context);
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ nextauth: string[] }> }
) {
    // Only rate limit sign-in attempts
    const { nextauth } = await context.params;
    const isSignIn = nextauth?.[0] === "signin" || nextauth?.[0] === "callback";
    
    if (isSignIn) {
        // Rate limiting: 5 login attempts per 15 minutes per IP (prevents brute force)
        const rateLimitResponse = await withRateLimit(5, 15 * 60 * 1000)(req);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
    }
    
    // Call the original NextAuth handler
    return handler(req, context);
}
