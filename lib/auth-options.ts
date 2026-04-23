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

        // 3. Check Public User
        const publicUser = await prisma.publicUser.findFirst({
            where: { email: { equals: emailToFind, mode: 'insensitive' } }
        });

        if (publicUser) {
             await prisma.publicUser.update({
                 where: { id: publicUser.id },
                 data: { 
                     fullName: user.name,
                     profileImage: user.image,
                     signupIp: "next-auth-signin" // We can't easily get IP here without request context, setting placeholder or leaving as is
                 }
             });
             return true;
        }

        // 4. Create New Public User
        // Consent is now taken AFTER login via a separate modal.
        // Initialize with false.
        await prisma.publicUser.create({
            data: {
                email: emailToFind,
                fullName: user.name,
                profileImage: user.image,
                providerId: user.id,
                consentNewsletter: false,
                consentLegal: false,
                consentVersion: null,
                consentTimestamp: null,
                roles: [], 
                interests: [],
                preferredChains: [],
                socialProfiles: {}
            }
        });

        // eslint-disable-next-line no-console
        console.log(`New Public user created (Pending Consent): ${user.email}`);
        return true; 
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("SignIn Error:", error);
        return "/public?error=server_error"; 
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Handle session update (e.g., client-side update({ consent: true }))
      if (trigger === "update" && session?.consent) {
          token.consent = session.consent;
      }
      // Handle 2FA verification update
      if (trigger === "update" && session?.twoFactorVerified) {
          token.twoFactorVerified = true;
      }

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
                token.consent = true; // Members implicitly consented
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
                token.consent = true; // Members implicitly consented
                return token;
            }

            // 3. Check Public User
            const publicUser = await prisma.publicUser.findFirst({
                where: { email: { equals: emailToFind, mode: 'insensitive' } },
                select: { id: true, consentLegal: true }
            });

            if (publicUser) {
                token.id = publicUser.id;
                token.role = 'PUBLIC';
                token.permissions = {};
                token.tags = [];
                token.consent = publicUser.consentLegal;
                return token;
            }
            
            // Should not happen if signIn creates the user, but fallback:
            token.role = 'PUBLIC';
            token.permissions = {};
            token.tags = [];
            token.consent = false;
            return token;

            // Check 2FA status (feature-flagged)
            if (process.env.ENABLE_2FA === "true" && token.email) {
                try {
                    const twoFactor = await prisma.twoFactorAuth.findUnique({
                        where: { userEmail: token.email as string },
                        select: { totpEnabled: true, passkeyEnabled: true },
                    });
                    token.twoFactorEnabled = !!(twoFactor?.totpEnabled || twoFactor?.passkeyEnabled);
                    token.twoFactorVerified = false;
                } catch {
                    token.twoFactorEnabled = false;
                    token.twoFactorVerified = false;
                }
            }

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
        s.consent = token.consent;
        s.twoFactorEnabled = token.twoFactorEnabled;
        s.twoFactorVerified = token.twoFactorVerified;
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
