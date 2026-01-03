import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // keeping for backward compat
      permissions?: Record<string, string>;
      tags?: string[];
    }
  }

  interface User {
    role?: string;
    permissions?: Record<string, string>;
    tags?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    permissions?: Record<string, string>;
    tags?: string[];
  }
}
