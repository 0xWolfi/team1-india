"use client";

import React from "react";
import Link from "next/link";
import { Github, Instagram, Linkedin, Send } from "lucide-react";
import { Team1Logo } from "@/components/Team1Logo";

export function Footer() {
  return (
    <footer className="py-4 mb-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-5 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl bg-zinc-900/60 backdrop-blur-2xl">
          <div className="flex flex-col items-center sm:items-start gap-1">
             <Team1Logo className="h-5 w-auto" />
             <p className="text-zinc-500 text-xs">© 2026 Team1India. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-5">
            <Link href="https://t.me/team1india" target="_blank" className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Send className="w-4 h-4"/>
            </Link>
            <Link href="#" className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </Link>
            <Link href="#" className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Linkedin className="w-4 h-4"/>
            </Link>
            <Link href="#" className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Instagram className="w-4 h-4"/>
            </Link>
            <Link href="#" className="flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <Github className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
