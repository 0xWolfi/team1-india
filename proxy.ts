import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Additional API route protection
    if (path.startsWith("/api/member") || path.startsWith("/api/applications") || path.startsWith("/api/upload")) {
      if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      
      // @ts-ignore
      const role = token.role;
      
      // Protect member-specific API routes
      if (path.startsWith("/api/member") && role !== 'MEMBER' && role !== 'CORE') {
        return new NextResponse("Forbidden", { status: 403 });
      }
      
      // Protect upload endpoint
      if (path.startsWith("/api/upload") && role !== 'MEMBER' && role !== 'CORE') {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (!token) return false;
        
        const path = req.nextUrl.pathname;
        // @ts-ignore
        const role = token.role;

        // Core routes: Only for CORE
        if (path.startsWith("/core")) {
          return role === "CORE";
        }

        // Member routes: For MEMBER or CORE
        if (path.startsWith("/member")) {
          return role === "MEMBER" || role === "CORE";
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/core/:path*",
    "/member/:path*",
    "/api/member/:path*",
    "/api/applications/:path*",
    "/api/upload/:path*",
  ],
};
