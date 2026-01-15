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
