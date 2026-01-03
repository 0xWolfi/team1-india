import React from "react";
import Link from "next/link";
import { Twitter, Linkedin, Instagram, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-6 mb-6">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md">
          <div className="flex flex-col items-center md:items-start">
             <span className="text-xl font-bold text-white tracking-tighter mb-2">Team1India</span>
             <p className="text-zinc-500 text-sm">© 2025 Team1India. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
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
