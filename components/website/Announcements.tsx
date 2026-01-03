import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Announcements() {
  return (
    <section id="announcements" className="py-4 my-2">
      <div className="container mx-auto px-6 flex justify-center">
        <Link 
            href="/announcements"
            className="group flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                New
            </span>
            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                Team1India Hackathon 2025 Registration is now open
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </section>
  );
}
