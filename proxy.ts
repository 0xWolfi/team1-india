import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      if (!token) return false;
      
      const path = req.nextUrl.pathname;
      const role = (token as any).role;

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
});

export const config = {
  matcher: ["/core/:path*", "/member/:path*"],
};
