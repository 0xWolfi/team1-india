import React from "react";

interface DashboardProps {
  title: string;
  role: string;
  children?: React.ReactNode;
}

export function DashboardLayout({ title, role, children }: DashboardProps) {
  return (
    <div className="min-h-screen pt-24 px-6 container mx-auto flex flex-col items-center">
      <div className="max-w-4xl w-full bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Badge */}
        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            {role} View
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6 tracking-tight">
            {title}
        </h1>
        
        <div className="w-full h-px bg-black/10 dark:bg-white/10 mb-8" />

        <div className="text-zinc-300 text-lg leading-relaxed space-y-4">
            {children}
        </div>
      </div>
    </div>
  );
}
