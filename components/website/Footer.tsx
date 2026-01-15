import React from "react";
import Link from "next/link";
import { Twitter, Linkedin, Instagram, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-6 mb-6">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-3xl bg-zinc-900/60 backdrop-blur-2xl">
          <div className="flex flex-col items-center md:items-start">
             <span className="text-xl font-bold text-white tracking-tighter mb-2">Team1India</span>
             <p className="text-zinc-500 text-sm">© 2025 Team1India. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="https://t.me/team1india" target="_blank" className="text-zinc-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.886.177-.176 3.293-2.991 3.356-3.15.008-.02.011-.097-.035-.138-.047-.04-.117-.027-.168-.016l-4.706 2.96c-1.319.414-2.378.366-3.411 0-.693-.245-1.37-.47-1.37-.87 0-.308.435-.615 1.15-.89 4.704-2.054 7.846-3.407 9.427-4.05 4.502-1.83 5.438-2.147 6.063-2.17h.033z"/>
                </svg>
            </Link>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </Link>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
            </Link>
             <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
            </Link>
             <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
