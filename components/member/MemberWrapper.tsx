"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface MemberWrapperProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export const MemberWrapper: React.FC<MemberWrapperProps> = ({ children, requireAuth = true }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // Check if user still exists (for auto-logout when deleted by superadmin)
    React.useEffect(() => {
        if (!requireAuth || status !== "authenticated") return;

        const checkUserValidity = async () => {
            try {
                const res = await fetch("/api/auth/check-validity", { cache: "no-store" });
                const data = await res.json();

                if (!data.valid) {
                    // User has been deleted or is inactive - force logout
                    console.warn(`User validity check failed: ${data.reason}. Forcing logout.`);
                    await signOut({ 
                        redirect: false,
                        callbackUrl: '/public?error=account_removed'
                    });
                    router.push('/public?error=account_removed');
                }
            } catch (error) {
                console.error("Failed to check user validity:", error);
                // Don't logout on network errors, just log
            }
        };

        // Check immediately
        checkUserValidity();

        // Check periodically every 30 seconds
        const interval = setInterval(checkUserValidity, 30000);

        return () => clearInterval(interval);
    }, [status, requireAuth, router, pathname]); // Added pathname to check on route changes too

    React.useEffect(() => {
        if (requireAuth && status === "unauthenticated") {
             // Redirect unauthenticated users
             const returnUrl = encodeURIComponent(pathname || '/member');
             router.push(`/public?error=login_required&callbackUrl=${returnUrl}`);
        } else if (requireAuth && status === "authenticated") {
             // Check if user has MEMBER or CORE role (CORE users can access member section)
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const userRole = (session?.user as any)?.role;

             if (userRole !== 'MEMBER' && userRole !== 'CORE') {
                 // User is authenticated but not a MEMBER or CORE
                 console.warn(`Access denied: User with role ${userRole} attempted to access member section`);
                 router.push('/public?error=access_denied');
             }
        }
    }, [status, session, requireAuth, router, pathname]);

    if (requireAuth && status === "loading") {
        return (
            <div className="min-h-screen pt-32 px-12 font-mono text-zinc-500 animate-pulse bg-black">
                Loading Member Portal...
            </div>
        )
    }

    if (requireAuth && status === "unauthenticated") {
        return null; // Will redirect via effect
    }

    // Additional check: Don't render if authenticated but wrong role
    if (requireAuth && status === "authenticated") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRole = (session?.user as any)?.role;
        if (userRole !== 'MEMBER' && userRole !== 'CORE') {
            return null; // Will redirect via effect
        }
    }

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 container mx-auto text-white pb-20 relative font-sans selection:bg-white/20">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-[200px] right-0 w-[600px] h-[600px] bg-red-900/05 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Content */}
            <main className="relative z-10 animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    );
};
