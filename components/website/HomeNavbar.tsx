"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Team1Logo } from "@/components/Team1Logo";
import { X } from "lucide-react";
import { ThemeToggle } from "@/components/website/ThemeToggle";

const navItems = [
  { label: "Events", href: "#events" },
  { label: "About", href: "#what-we-do" },
  { label: "Programs", href: "#programs" },
  { label: "Impact", href: "#impact" },
  { label: "Community", href: "#get-involved" },
];

export function HomeNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsScrolling(true);
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 ease-out",
          // Mobile: full width, top
          "top-0 left-0 w-full border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-xl",
          // Desktop: floating pill, centered
          "md:top-6 md:left-1/2 md:-translate-x-1/2 md:w-fit md:max-w-[95vw] md:bg-transparent md:border-none md:backdrop-filter-none",
          isScrolled && "md:scale-90 md:translate-y-[-10px]",
          isScrolling && isScrolled && "opacity-0 -translate-y-[150%] md:-translate-y-[150%] pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between md:justify-start w-full gap-1 px-6 py-3 md:p-1.5 md:rounded-2xl md:bg-white/60 dark:md:bg-black/40 md:backdrop-blur-md md:border md:border-black/10 dark:md:border-white/10 md:shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:md:shadow-[0_8px_32px_rgba(0,0,0,0.5)] md:supports-[backdrop-filter]:bg-white/40 dark:md:supports-[backdrop-filter]:bg-black/20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:px-3 md:py-2 rounded-lg transition-all group">
            <Team1Logo className="h-3.5 w-auto relative z-10" />
          </Link>

          {/* Divider */}
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1 hidden md:block" />

          {/* Center Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1 hidden md:block" />

          {/* Right Actions */}
          <div className="flex items-center gap-2 pl-1">
            <Link
              href="/public"
              className="hidden md:flex px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-all nav-shine-text"
            >
              Explore
            </Link>
            <a
              href="https://t.me/avalanche_hi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
            >
              Join Us
            </a>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Dock */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[45] bg-white/80 dark:bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/public"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Explore Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
