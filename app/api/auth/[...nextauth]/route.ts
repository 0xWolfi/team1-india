import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

// Wrap NextAuth handler with rate limiting for login attempts
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ nextauth: string[] }> }
) {
    // Only rate limit the signin page, NOT the OAuth callback
    // Callback is where Google redirects back - should not be rate limited
    const { nextauth } = await context.params;
    const isSignInPage = nextauth?.[0] === "signin";

    if (isSignInPage) {
        // Rate limiting: 20 attempts per 15 minutes per IP
        const rateLimitResponse = await withRateLimit(20, 15 * 60 * 1000)(req);
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
    // Only rate limit signin POST (for credentials provider if used)
    const { nextauth } = await context.params;
    const isSignInPage = nextauth?.[0] === "signin";

    if (isSignInPage) {
        // Rate limiting: 20 attempts per 15 minutes per IP
        const rateLimitResponse = await withRateLimit(20, 15 * 60 * 1000)(req);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
    }

    // Call the original NextAuth handler
    return handler(req, context);
}
