"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Team1Logo } from "@/components/Team1Logo";
import { useSession, signOut, signIn } from "next-auth/react";
import { LayoutDashboard, LogOut, User, X } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { PublicLoginModal } from "@/components/public/auth/PublicLoginModal";
import { useDrag } from "@use-gesture/react";

const navItems = [
    { label: "Home", href: "/public", icon: "Home" },
    { label: "Programs", href: "/public/programs", icon: "Rocket" },
    { label: "Playbooks", href: "/public/playbooks", icon: "Book" },
    { label: "Bounties", href: "/public/bounty", icon: "Zap" },
    { label: "Leaderboard", href: "/public/leaderboard", icon: "Trophy" },
    { label: "Contact", href: "/public#contact", icon: "Mail" },
];

export function FloatingNav() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
             // Check both window and main for scroll position (mobile uses main for snap)
             const main = document.querySelector('main');
             const scrollY = window.scrollY || main?.scrollTop || 0;
             setIsScrolled(scrollY > 20);

             const sections = navItems.map(item => item.href.substring(1));
             let current = "";
             const viewportCenter = window.innerHeight / 2;

             for (const section of sections) {
                 const element = document.getElementById(section);
                 if (element) {
                     const rect = element.getBoundingClientRect();
                     // rect is always relative to viewport, so this logic stands
                     if (rect.top < viewportCenter && rect.bottom >= viewportCenter) {
                        current = section;
                     }
                 }
                 // Handle mobile verify overlap
                 if (window.innerWidth < 768) {
                     const mobileVerify = document.getElementById('verify-mobile');
                     if (mobileVerify) {
                         const rect = mobileVerify.getBoundingClientRect();
                         if (rect.top < viewportCenter && rect.bottom >= viewportCenter) {
                             current = "verify-mobile";
                         }
                     }
                 }
             }
             
             // Map verify-mobile back to verify-desktop for active state if needed, 
             // but since we separate them, we might need to handle the active check in the map loop.
             // Actually, let's keep it simple. If current is verify-mobile, we want the Verify tab active.
             if (current === 'verify-mobile') current = 'verify-desktop';
             
             setActiveSection(current);
        };

        window.addEventListener("scroll", handleScroll);
        const main = document.querySelector('main');
        if (main) main.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (main) main.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const bind = useDrag(({ swipe: [swipeX, swipeY] }) => {
        // Swipe Down (swipeY=1) or Swipe Right (swipeX=1) closes menu
        if (swipeY === 1 || swipeX === 1) {
             setIsMobileMenuOpen(false);
        }
    });

    return (
        <>
            <div className={cn(
                "fixed z-50 transition-all duration-300 ease-out",
                // Base (Mobile): Full width, top 0, transparent
                "top-0 left-0 w-full border-b border-white/5 bg-black/20 backdrop-blur-xl",
                // Desktop overrides: Floating pill, centered
                "md:top-6 md:left-1/2 md:-translate-x-1/2 md:w-fit md:max-w-[95vw] md:bg-transparent md:border-none md:backdrop-filter-none", 
                isScrolled && "md:scale-90 md:translate-y-[-10px]"
            )}>
                <div className="flex items-center justify-between md:justify-start w-full gap-1 px-6 py-3 md:p-1.5 md:rounded-2xl md:bg-black/40 md:backdrop-blur-md md:border md:border-white/10 md:shadow-[0_8px_32px_rgba(0,0,0,0.5)] md:supports-[backdrop-filter]:bg-black/20">
                    
                    {/* Logo / Home */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 md:px-3 md:py-2 rounded-lg transition-all group"
                    >
                        <Team1Logo className="h-3.5 w-auto relative z-10" />
                    </Link>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

                    {/* Center Nav (Desktop) */}
                    <nav className="hidden md:flex items-center gap-0.5">
                        {navItems.map((item) => {
                            const isActive = item.href.startsWith('#')
                                ? activeSection === item.href.substring(1)
                                : item.href === '/public'
                                    ? pathname === '/public'
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 relative",
                                        isActive
                                            ? "text-white"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 pl-1">
                        {session?.user ? (
                            <button 
                                onClick={() => setShowUserMenu(true)}
                                className="flex items-center gap-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all md:p-1 md:pl-2 md:pr-2"
                            >
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10 overflow-hidden relative">
                                    {session.user.image ? (
                                        <Image 
                                            src={session.user.image} 
                                            alt={session.user.name || "User"} 
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span>{session.user.name?.[0] || session.user.email?.[0] || "U"}</span>
                                    )}
                                </div>
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowLoginModal(true)}
                                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors md:p-2 md:w-auto md:h-auto"
                                title="Member Access"
                            >
                                <User className="w-5 h-5"/>
                            </button>
                        )}


                    </div>
                </div>
            </div>






            <PublicLoginModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
            />

            {/* User Menu Modal */}
            {showUserMenu && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                         <button 
                            onClick={() => setShowUserMenu(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5"/>
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-zinc-800 shadow-xl overflow-hidden relative">
                                {session?.user?.image ? (
                                    <Image 
                                        src={session.user.image} 
                                        alt={session.user.name || "User"} 
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <span>{session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}</span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-white text-lg">{session?.user?.name || "User"}</div>
                                <div className="text-xs text-zinc-500">{session?.user?.email}</div>
                                <div className="mt-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold uppercase text-yellow-500 w-fit">
                                    {(session?.user as any)?.role === 'PUBLIC' ? 'Public Member' : (session?.user as any)?.role || "Guest"}
                                </div>
                            </div>
                        </div>

                         <div className="space-y-3">
                            {/* Core/Member Dashboard */}
                            {((session?.user as any)?.role === 'CORE' || (session?.user as any)?.role === 'MEMBER') && (
                                <Link
                                    href={(session?.user as any)?.role === 'CORE' ? '/core' : '/member'}
                                    className="group w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4 transition-transform group-hover:scale-110"/> 
                                    <span className="transition-transform duration-200 group-hover:scale-105">Go to Dashboard</span>
                                </Link>
                            )}

                             {/* Public Dashboard */}
                             {(session?.user as any)?.role === 'PUBLIC' && (
                                <Link
                                    href="/public/profile"
                                    className="group w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4 transition-transform group-hover:scale-110"/> 
                                    <span className="transition-transform duration-200 group-hover:scale-105">My Profile</span>
                                </Link>
                            )}

                            <button 
                                onClick={() => signOut()}
                                className="group w-full py-3 bg-white/5 text-zinc-400 font-bold rounded-xl hover:bg-red-500/10 hover:text-red-500 border border-white/5 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4 transition-transform group-hover:scale-110"/> 
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Mobile Bottom Dock */}
            <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-3 py-2.5 flex items-center justify-between shadow-2xl">
                {navItems.map((item) => {
                    const isActive = item.href === '/public'
                        ? pathname === '/public'
                        : pathname.startsWith(item.href) && item.href !== '/public';
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all duration-300 p-2 rounded-xl",
                                isActive 
                                    ? "text-white bg-white/10" 
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            )}
                            title={item.label}
                        >
                            <DynamicIcon name={item.icon} className="w-5 h-5"/>
                        </Link>
                    )
                })}
            </div>
        </>
    );
}
