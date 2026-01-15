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
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-.94-2.4-1.55-1.06-.7-.37-1.09.22-1.7l3.75-3.4c.18-.18.34-.44.04-.44-.22 0-.32.07-.46.16l-4.74 3-.26.16c-1.04.29-1.56.28-2.22.07-.63-.2-1.22-.39-1.22-.72 0-.27.4-.55 1.08-.82 4.23-1.84 7.05-3.04 8.46-3.61 4.05-1.63 4.89-1.93 5.43-1.95.12 0 .38.03.55.17.14.12.18.28.2.46-.02.2-.04.4-.04.56z"/>
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
