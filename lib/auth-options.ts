import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return "/public"; 

      try {
        const emailToFind = user.email ? user.email.trim() : "";
        const member = await prisma.member.findFirst({
          where: { email: { equals: emailToFind, mode: 'insensitive' } },
        });

        if (member) {
          // Sync profile info
          // @ts-ignore
          await prisma.member.update({ where: { id: member.id }, data: { name: user.name, image: user.image } });
          return true;
        }

        // Secondary Check: Community Member
        // @ts-ignore
        const communityMember = await prisma.communityMember.findFirst({
             where: { email: { equals: emailToFind, mode: 'insensitive' } },
        });

        if (communityMember) {
             // @ts-ignore
             await prisma.communityMember.update({ where: { id: communityMember.id }, data: { name: user.name } });
             return true;
        }

        // Reject unauthorized users
        // Note: Using console.log here is acceptable for auth flow logging
        // eslint-disable-next-line no-console
        console.log(`Access Denied: User ${user.email} is not a member.`);
        return "/public?error=not_member"; 
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("SignIn Error:", error);
        return "/public?error=server_error"; 
      }
    },
    async jwt({ token, user }) {
      if (user) {
        try {
            const emailToFind = user.email ? user.email.trim() : "";
            
            // 1. Check Core DB
            const member = await prisma.member.findFirst({
                where: { email: { equals: emailToFind, mode: 'insensitive' } },
                // @ts-ignore
                select: { id: true, permissions: true, tags: true }
            });

            if (member) {
                token.id = member.id as string;
                token.role = 'CORE';
                token.permissions = (member.permissions as Record<string, string>) || { default: "READ" };
                token.tags = member.tags || [];
                return token;
            }

            // 2. Check Community DB
            // @ts-ignore
            const communityMember = await prisma.communityMember.findFirst({
                where: { email: { equals: emailToFind, mode: 'insensitive' } },
                select: { id: true, tags: true }
            });

            if (communityMember) {
                token.id = communityMember.id as string;
                token.role = 'MEMBER';
                token.permissions = {};
                token.tags = communityMember.tags ? [communityMember.tags] : [];
                return token;
            }

            // 3. No valid membership found - should not reach here due to signIn check
            // eslint-disable-next-line no-console
            console.error(`User ${user.email} authenticated but has no valid role. This should not happen.`);
            token.role = 'GUEST'; // Fallback, but signIn callback should have blocked this
            token.permissions = {};
            token.tags = [];
            return token;

        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = session.user as any;
        s.role = token.role;
        s.id = token.id;
        s.permissions = token.permissions;
        s.tags = token.tags;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    // Optional: error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
