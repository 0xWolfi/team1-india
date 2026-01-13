"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut, signIn } from "next-auth/react";
import { User, X, LogOut, LayoutDashboard, LogIn } from "lucide-react";

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

    return (
        <>
            <div className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[95vw] transition-all duration-300 ease-out",
                isScrolled ? "scale-90 translate-y-[-10px]" : "scale-100"
            )}>
                <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] supports-[backdrop-filter]:bg-black/20">
                    
                    {/* Logo / Home */}
                    <Link 
                        href="/"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all group"
                    >
                        <div className="relative w-5 h-5 flex items-center justify-center">
                            <div className="absolute inset-0 bg-white rounded-full blur-md opacity-40 group-hover:opacity-100 transition-opacity" />
                            <img src="/t1-logo.png" alt="T1" className="w-3.5 h-3.5 object-contain relative z-10" />
                        </div>
                        <span className="font-bold text-sm text-zinc-300 group-hover:text-white hidden md:block tracking-tight transition-colors">Team1</span>
                    </Link>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

                    {/* Center Nav */}
                    <nav className="flex items-center gap-0.5">
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
                    <div className="w-px h-6 bg-white/10 mx-1 mobile-hide" />

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 pl-1">
                        {session?.user ? (
                            <button 
                                onClick={() => setShowUserMenu(true)}
                                className="p-1 pl-2 pr-2 flex items-center gap-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-black overflow-hidden relative">
                                    {session.user.image ? (
                                        <img 
                                            src={session.user.image} 
                                            alt={session.user.name || "User"} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{session.user.name?.[0] || session.user.email?.[0] || "U"}</span>
                                    )}
                                </div>
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowLoginModal(true)}
                                className="p-2 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                title="Member Access"
                            >
                                <User className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

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

                        <h3 className="text-xl font-bold text-white mb-2">Member Access</h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                            This portal is accessible only to verified Team1 members. <br/>
                            To submit applications, you can login as a Guest.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="https://tally.so/r/w7Xj0A"
                                target="_blank"
                                className="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                Apply for Membership
                            </Link>
                        </div>

                        {/* Login Buttons for Members */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-zinc-500 text-xs mb-3 text-center">Already a member?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowLoginModal(false);
                                        signIn('google', { callbackUrl: '/access-check' });
                                    }}
                                    className="flex-1 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2 text-xs"
                                >
                                    <LogIn className="w-3.5 h-3.5" /> Member Login
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLoginModal(false);
                                        signIn('google', { callbackUrl: '/access-check' });
                                    }}
                                    className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 text-xs"
                                >
                                    <LogIn className="w-3.5 h-3.5" /> Core Team Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Menu Modal */}
            {showUserMenu && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                         <button 
                            onClick={() => setShowUserMenu(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-zinc-800 shadow-xl overflow-hidden relative">
                                {session?.user?.image ? (
                                    <img 
                                        src={session.user.image} 
                                        alt={session.user.name || "User"} 
                                        className="w-full h-full object-cover"
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
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                                </Link>
                            )}

                            <button 
                                onClick={() => signOut()}
                                className="w-full py-3 bg-white/5 text-red-400 font-bold rounded-xl hover:bg-red-500/10 border border-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
