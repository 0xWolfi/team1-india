"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface CoreWrapperProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export const CoreWrapper: React.FC<CoreWrapperProps> = ({ children, requireAuth = true }) => {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        if (requireAuth && status === "unauthenticated") {
             // Only redirect if explicitly required and not loading
             const returnUrl = encodeURIComponent(pathname || '/core');
             router.push(`/public?error=login_required&callbackUrl=${returnUrl}`);
        }
    }, [status, requireAuth, router, pathname]);

    if (requireAuth && status === "loading") {
        return (
            <div className="min-h-screen pt-32 px-12 font-mono text-zinc-500 animate-pulse bg-black">
                Initializing Secure Environment...
            </div>
        )
    }

    if (requireAuth && status === "unauthenticated") {
        return null; // Will redirect via effect
    }

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 container mx-auto text-white pb-20 relative font-sans selection:bg-white/20">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-[200px] right-0 w-[600px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Content */}
            <main className="relative z-10 animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    );
};
