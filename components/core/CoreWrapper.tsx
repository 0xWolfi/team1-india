"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface CoreWrapperProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export const CoreWrapper: React.FC<CoreWrapperProps> = ({ children, requireAuth = true }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        if (requireAuth && status === "unauthenticated") {
             // Redirect unauthenticated users
             const returnUrl = encodeURIComponent(pathname || '/core');
             router.push(`/public?error=login_required&callbackUrl=${returnUrl}`);
        } else if (requireAuth && status === "authenticated") {
             // Check if user has CORE role
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const userRole = (session?.user as any)?.role;

             if (userRole !== 'CORE') {
                 // User is authenticated but not a CORE member
                 console.warn(`Access denied: User with role ${userRole} attempted to access core section`);
                 router.push('/public?error=access_denied');
             }
        }
    }, [status, session, requireAuth, router, pathname]);

    if (requireAuth && status === "loading") {
        return (
            <div className="min-h-screen pt-32 px-12 font-mono text-zinc-500 animate-pulse bg-white dark:bg-black">
                Initializing Secure Environment...
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
        if (userRole !== 'CORE') {
            return null; // Will redirect via effect
        }
    }

    return (
        <div className="min-h-[100svh] pt-20 sm:pt-24 px-4 sm:px-6 md:px-10 lg:px-12 container mx-auto text-black dark:text-white pb-16 sm:pb-20 relative selection:bg-black/20 dark:selection:bg-white/20">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/80 dark:from-black/80 via-white/50 dark:via-black/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-[200px] right-0 w-[600px] h-[600px] bg-purple-100/10 dark:bg-purple-900/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Content */}
            <main className="relative z-10 animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    );
};
