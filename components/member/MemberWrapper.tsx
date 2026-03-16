"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/website/Footer";
import { Team1Logo } from "@/components/Team1Logo";
import Image from "next/image";
import { MotionIcon } from "motion-icons-react";
import { cn } from "@/lib/utils";

interface MemberWrapperProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

const NAV_ITEMS = [
    { label: "Dashboard", href: "/member", icon: "Home", exact: true },
    { label: "Events", href: "/member/events", icon: "Calendar" },
    { label: "Programs", href: "/member/programs", icon: "Users" },
    { label: "Playbooks", href: "/member/playbooks", icon: "BookOpen" },
    { label: "Bounties", href: "/member/bounty", icon: "Zap" },
    { label: "Proposals", href: "/member/experiments", icon: "Vote" },
    { label: "Directory", href: "/member/directory", icon: "User" },
    { label: "Announcements", href: "/member/announcements", icon: "Bell" },
];

export const MemberWrapper: React.FC<MemberWrapperProps> = ({ children, requireAuth = true }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageCacheBust, setImageCacheBust] = useState<number>(0);
    const [profileImageError, setProfileImageError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        const handleProfileUpdate = () => fetchProfileImage();
        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const buildImageSrc = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.includes(".public.blob.vercel-storage.com") && imageCacheBust) {
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}t=${imageCacheBust}`;
        }
        return url;
    };

    const displayImage = profileImage || session?.user?.image;

    // Check if user still exists (for auto-logout when deleted by superadmin)
    useEffect(() => {
        if (!requireAuth || status !== "authenticated") return;

        const checkUserValidity = async () => {
            try {
                const res = await fetch("/api/auth/check-validity", { cache: "no-store" });
                const data = await res.json();

                if (!data.valid) {
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

        checkUserValidity();
        const interval = setInterval(checkUserValidity, 30000);
        return () => clearInterval(interval);
    }, [status, requireAuth, router, pathname]);

    useEffect(() => {
        if (requireAuth && status === "unauthenticated") {
            const returnUrl = encodeURIComponent(pathname || '/member');
            router.push(`/public?error=login_required&callbackUrl=${returnUrl}`);
        } else if (requireAuth && status === "authenticated") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userRole = (session?.user as any)?.role;
            if (userRole !== 'MEMBER' && userRole !== 'CORE') {
                console.warn(`Access denied: User with role ${userRole} attempted to access member section`);
                router.push('/public?error=access_denied');
            }
        }
    }, [status, session, requireAuth, router, pathname]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    // Close on Escape
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [mobileMenuOpen]);

    if (requireAuth && status === "loading") {
        return (
            <div className="min-h-screen pt-32 px-12 font-mono text-zinc-500 animate-pulse bg-black">
                Loading Member Portal...
            </div>
        );
    }

    if (requireAuth && status === "unauthenticated") {
        return null;
    }

    if (requireAuth && status === "authenticated") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRole = (session?.user as any)?.role;
        if (userRole !== 'MEMBER' && userRole !== 'CORE') {
            return null;
        }
    }

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    };

    const NavContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06] flex-shrink-0">
                <Team1Logo className="w-5 h-5" />
                <span className="font-bold text-lg tracking-tight text-white">Team1</span>
                <span className="ml-auto text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    member
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group",
                                active
                                    ? "bg-white/[0.08] text-white"
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                            )}
                        >
                            <MotionIcon
                                name={item.icon}
                                className={cn(
                                    "w-[18px] h-[18px] pointer-events-none transition-colors",
                                    active ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"
                                )}
                            />
                            <span>{item.label}</span>
                            {active && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Profile & Logout */}
            <div className="px-3 py-3 border-t border-white/[0.06] space-y-0.5 flex-shrink-0">
                <Link
                    href="/member/profile"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                        pathname === "/member/profile"
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                    )}
                >
                    <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 bg-zinc-800 flex-shrink-0 relative [&>div]:!relative [&>div]:!w-full [&>div]:!h-full">
                        {displayImage && !profileImageError ? (
                            <div className="relative w-full h-full">
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
                            <div className="w-full h-full flex items-center justify-center">
                                <MotionIcon name="User" className="w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session?.user?.name || "Profile"}</p>
                        <p className="text-[11px] text-zinc-600 truncate">{session?.user?.email}</p>
                    </div>
                </Link>
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/public' })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200"
                >
                    <MotionIcon name="LogOut" className="w-[18px] h-[18px] pointer-events-none" />
                    <span>Sign out</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-[100svh] text-white relative font-sans selection:bg-white/20">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-[200px] right-0 w-[600px] h-[600px] bg-zinc-900/05 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] z-40 flex-col bg-black/50 backdrop-blur-2xl border-r border-white/[0.06]">
                <NavContent />
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-50 px-4 py-3 bg-black/40 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <MotionIcon name="Menu" className="w-5 h-5 pointer-events-none" />
                    </button>
                    <Team1Logo className="w-4 h-4" />
                    <span className="font-bold text-base tracking-tight text-white">Team1</span>
                </div>
                <Link
                    href="/member/profile"
                    className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-zinc-800 flex items-center justify-center relative [&>div]:!relative [&>div]:!w-full [&>div]:!h-full"
                    title="My Profile"
                >
                    {displayImage && !profileImageError ? (
                        <div className="relative w-full h-full">
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
                        <MotionIcon name="User" className="w-4 h-4 text-zinc-400 pointer-events-none" />
                    )}
                </Link>
            </header>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col bg-zinc-950/95 backdrop-blur-2xl border-r border-white/[0.06] animate-in fade-in duration-200">
                        <NavContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="lg:pl-[260px] flex flex-col min-h-[100svh]">
                <main className="flex-1 relative z-10 animate-in fade-in duration-500 px-5 md:px-8 lg:px-10 py-6 lg:py-8">
                    {children}
                </main>
                <div className="w-full">
                    <Footer />
                </div>
            </div>
        </div>
    );
};
