"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Footer } from "@/components/website/Footer";
import { Team1Logo } from "@/components/Team1Logo";
import Image from "next/image";
import { Settings, LogOut } from "lucide-react";

interface MemberWrapperProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export const MemberWrapper: React.FC<MemberWrapperProps> = ({ children, requireAuth = true }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageCacheBust, setImageCacheBust] = useState<number>(0);
    const [profileImageError, setProfileImageError] = useState(false);

    // Fetch latest profile image from API (not session, which can be stale)
    const fetchProfileImage = async () => {
        if (status !== "authenticated") return;
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.image) {
                    setProfileImage(data.image);
                    setImageCacheBust(Date.now());
                    setProfileImageError(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile image:", error);
        }
    };

    useEffect(() => {
        fetchProfileImage();
        // Listen for profile updates (triggered after saving profile)
        const handleProfileUpdate = () => {
            fetchProfileImage();
        };
        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, [status]);

    const buildImageSrc = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.includes(".public.blob.vercel-storage.com") && imageCacheBust) {
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}t=${imageCacheBust}`;
        }
        return url;
    };

    // Use fetched image, fallback to session image
    const displayImage = profileImage || session?.user?.image;

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
                // Don't logout on network errors, silent fail
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
        <div className="min-h-[100svh] text-white relative font-sans selection:bg-white/20 flex flex-col">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-[200px] right-0 w-[600px] h-[600px] bg-zinc-900/05 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Mobile Sticky Nav (Core-like) */}
            <div className="md:hidden sticky top-0 z-50 w-full px-6 py-3 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                         <Team1Logo className="w-4 h-4" />
                     <span className="font-bold text-lg tracking-tight text-white">Team1</span>
                </div>
                
                <div className="flex items-center gap-3">
                     {displayImage && !profileImageError ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                                 <Image 
                                    src={buildImageSrc(displayImage) || displayImage} 
                                    alt="Profile" 
                                    fill 
                                    className="object-cover"
                                    onError={() => setProfileImageError(true)}
                                    unoptimized={displayImage.startsWith('data:') || displayImage.startsWith('blob:')}
                                 />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ring-1 ring-white/10">
                                 <LogOut className="w-4 h-4 text-zinc-400" /> {/* Fallback icon */}
                            </div>
                        )}
                    <button 
                        onClick={() => router.push('/member/profile')}
                        className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/public' })}
                        className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <main className="relative z-10 animate-in fade-in duration-500 flex-1 pt-8 md:pt-24 px-6 md:px-12 container mx-auto">
                {children}
            </main>

            {/* Footer - Full Width Context */}
            <div className="relative z-10 w-full">
                <Footer />
            </div>
        </div>
    );
};
