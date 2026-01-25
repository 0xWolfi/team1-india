import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // --- PUBLIC ALLOWLIST ---
    // Allow Auth routes
    if (path.startsWith("/api/auth")) {
        return NextResponse.next();
    }
    // Allow Public API routes
    if (path.startsWith("/api/public") || path.startsWith("/api/webhooks") || path.startsWith("/api/luma-events")) {
        return NextResponse.next();
    }
    // Allow public seed routes in DEV only (optional, but good practice)
    if (path.startsWith("/api/seed") && process.env.NODE_ENV !== 'production') {
        return NextResponse.next();
    }
    
    // --- UI ROUTE PROTECTION ---
    // 1. Block Public Access to /member and /core -> 404
    if (path.startsWith("/member") || path.startsWith("/core")) {
        if (!token) {
            return NextResponse.rewrite(new URL("/404", req.url));
        }

        // @ts-ignore
        const role = token.role;

        // 2. Block Non-CORE access to /core -> 404
        if (path.startsWith("/core") && role !== 'CORE') {
             return NextResponse.rewrite(new URL("/404", req.url));
        }
        
        // Optional: Enforce role for /member too? 
        // Assuming any authenticated user with MEMBER/CORE role can access /member.
        // If you have other roles like "USER" that shouldn't access member, uncomment below:
        // if (path.startsWith("/member") && role !== 'MEMBER' && role !== 'CORE') {
        //      return NextResponse.rewrite(new URL("/404", req.url));
        // }
    }
    
    // --- AUTHENTICATION CHECK (API) ---
    // If not handled by UI check above, check API
    if (path.startsWith("/api/")) {
        if (!token) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized" }), 
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // @ts-ignore
        const role = token.role;

        // --- RBAC: MEMBER ROUTES ---
        if (path.startsWith("/api/member")) {
            if (role !== 'MEMBER' && role !== 'CORE') {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }
        
        // --- RBAC: UPLOAD ---
        if (path.startsWith("/api/upload")) {
            if (role !== 'MEMBER' && role !== 'CORE') {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // We handle logic in the function above, so we can return true here 
        // to let the function run, OR use this for basic non-null checks.
        // Returning 'true' allows the middleware function to execute.
        return true; 
      },
    },
  }
);

export const config = {
  matcher: [
    // PROTECT ALL API ROUTES
    "/api/:path*",
    // Protect UI pages
    "/core/:path*",
    "/member/:path*",
  ],
};
