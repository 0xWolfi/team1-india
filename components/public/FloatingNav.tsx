"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, X } from "lucide-react";

const navItems = [
    { label: "Playbooks", href: "#playbooks" },
    { label: "Programs", href: "#programs" },
    { label: "Content", href: "#content" },
    { label: "Events", href: "#events" },
    { label: "Media", href: "#media" },
    { label: "Contact", href: "#contact" },
];

export function FloatingNav() {
    const [activeSection, setActiveSection] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

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
                        <button 
                            onClick={() => setShowLoginModal(true)}
                            className="p-2 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            title="Member Access"
                        >
                            <User className="w-5 h-5" />
                        </button>
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
                        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                            This portal is accessible only to verified Team1 members. <br/>
                            Please log in or apply to join our ecosystem.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link 
                                href="/access-check"
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                            >
                                I'm a Member — Log In
                            </Link>
                            <Link 
                                href="https://tally.so/r/w7Xj0A" 
                                target="_blank"
                                className="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                Apply for Membership
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
