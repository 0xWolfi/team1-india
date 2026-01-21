"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Team1Logo } from "@/components/Team1Logo";
import { useSession, signOut, signIn } from "next-auth/react";
import { User, X, LogOut, LayoutDashboard, LogIn, Menu } from "lucide-react";
import { useDrag } from "@use-gesture/react";

const navItems = [
    { label: "Playbooks", href: "#playbooks" },
    { label: "Programs", href: "#programs" },
    { label: "Content", href: "#content" },
    { label: "Events", href: "#events" },
    { label: "Media", href: "#media" },
    { label: "Contact", href: "#contact" },
];

export function FloatingNav() {
    const { data: session } = useSession();
    const [activeSection, setActiveSection] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
             setIsScrolled(window.scrollY > 20);
             const sections = navItems.map(item => item.href.substring(1));
             let current = "";
             const viewportCenter = window.innerHeight / 2;

             for (const section of sections) {
                 const element = document.getElementById(section);
                 if (element) {
                     const rect = element.getBoundingClientRect();
                     if (rect.top < viewportCenter && rect.bottom >= viewportCenter) {
                        current = section;
                     }
                 }
             }
             setActiveSection(current);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
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
                        <Team1Logo className="w-4 h-4 relative z-10" />
                        <span className="font-bold text-lg md:text-sm text-zinc-300 group-hover:text-white tracking-tight transition-colors">Team1</span>
                    </Link>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

                    {/* Center Nav (Desktop) */}
                    <nav className="hidden md:flex items-center gap-0.5">
                        {navItems.map((item) => {
                            const isActive = activeSection === item.href.substring(1);
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
                                <User className="w-5 h-5" />
                            </button>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>




            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    {...bind()} 
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 md:hidden touch-none"
                >
                    <div className="flex flex-col h-full p-6">
                        <div className="flex justify-end mb-8">
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <nav className="flex flex-col gap-6 items-center justify-center flex-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "text-2xl font-bold uppercase tracking-widest transition-colors",
                                        activeSection === item.href.substring(1)
                                            ? "text-white"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
                             {session?.user ? (
                                <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden relative">
                                        {session.user.image ? (
                                            <Image 
                                                src={session.user.image} 
                                                alt={session.user.name || "User"} 
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span>{session.user.name?.[0] || "U"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-bold truncate">{session.user.name}</div>
                                        <div className="text-zinc-500 text-xs truncate">{session.user.email}</div>
                                    </div>
                                    <button 
                                        onClick={() => setShowUserMenu(true)} 
                                        className="text-indigo-400 text-sm font-bold uppercase tracking-wider"
                                    >
                                        Menu
                                    </button>
                                </div>
                             ) : (
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setShowLoginModal(true);
                                    }}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2"
                                >
                                    <User className="w-5 h-5" /> Member Login
                                </button>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
                        <button 
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <User className="w-8 h-8 text-zinc-400" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Sign In to Apply</h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                            Login with your Google account to submit applications and access programs.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    signIn('google', { callbackUrl: window.location.pathname });
                                }}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" /> Sign In with Google
                            </button>

                            <div className="flex items-center gap-4 my-2">
                                <div className="h-px bg-white/10 flex-1" />
                                <span className="text-zinc-500 text-xs uppercase tracking-widest">or</span>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>

                            <Link
                                href="https://tally.so/r/w7Xj0A"
                                target="_blank"
                                className="w-full py-3 bg-white/5 text-zinc-400 font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Apply for Membership
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* User Menu Modal */}
            {showUserMenu && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                         <button 
                            onClick={() => setShowUserMenu(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
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
                                <div className="mt-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase text-zinc-400 w-fit">
                                    {(session?.user as any)?.role || "Guest"}
                                </div>
                            </div>
                        </div>

                         <div className="space-y-3">
                            {((session?.user as any)?.role === 'CORE' || (session?.user as any)?.role === 'MEMBER') && (
                                <Link
                                    href={(session?.user as any)?.role === 'CORE' ? '/core' : '/member'}
                                    className="group w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4 transition-transform group-hover:scale-110" /> 
                                    <span className="transition-transform duration-200 group-hover:scale-105">Go to Dashboard</span>
                                </Link>
                            )}

                            <button 
                                onClick={() => signOut()}
                                className="group w-full py-3 bg-white/5 text-zinc-400 font-bold rounded-xl hover:bg-red-500/10 hover:text-red-500 border border-white/5 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" /> 
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
