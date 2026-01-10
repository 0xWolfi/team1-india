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
        
        console.log(`Guest Login: User ${user.email} allowed.`);
        return true; 
      } catch (error) {
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

            // 3. Guest User
            token.id = user.id;
            token.role = 'GUEST';
            token.permissions = {};
            token.tags = [];
            return token;

        } catch (e) {
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
  },
};
