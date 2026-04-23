"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Layers, Heart, Eye } from "lucide-react";
import Link from "next/link";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

export default function ProfileProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/projects/my").then((r) => r.json()).then((d) => setProjects(d.projects || []));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <FloatingNav />
      <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <Link href="/public/profile" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <h1 className="text-3xl font-bold">My Projects</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/public/projects/${p.slug}`} className="p-5 rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors">
              <h3 className="font-bold mb-1">{p.title}</h3>
              <p className="text-zinc-500 text-sm line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.likeCount}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.viewCount}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status === "published" ? "bg-green-500/10 text-green-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>{p.status}</span>
              </div>
            </Link>
          ))}
        </div>
        {projects.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No projects yet. Create your first one!</p>}
      </div>
      <Footer />
    </div>
  );
}
