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
    
    // --- AUTHENTICATION CHECK ---
    // If we are here, the route assumes protection.
    if (!token) {
      return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
      
    // @ts-ignore
    const role = token.role;

    // --- RBAC: MEMBER ROUTES ---
    // Routes starting with /api/member require MEMBER or CORE role
    if (path.startsWith("/api/member")) {
        if (role !== 'MEMBER' && role !== 'CORE') {
             return new NextResponse("Forbidden", { status: 403 });
        }
    }
      
    // --- RBAC: UPLOAD ---
    // Uploads require MEMBER or CORE
    if (path.startsWith("/api/upload")) {
        if (role !== 'MEMBER' && role !== 'CORE') {
             return new NextResponse("Forbidden", { status: 403 });
        }
    }

    // --- RBAC: CORE/ADMIN ROUTES ---
    // Any other /api/* routes not explicitly handled above?
    // If you have admin-only routes, add them here.
    // For now, allow authenticated users to proceed to route handlers which do granular checks.
    // OR enforce strict Core-only default:
    // if (!path.startsWith("/api/member") && !path.startsWith("/api/upload") && role !== 'CORE') {
    //    return new NextResponse("Forbidden. Core access required.", { status: 403 });
    // }

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
