import React from "react";

export function Impact() {
  return (
    <section id="impact" className="py-20 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
          What We Have Done
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Stat 1 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/10 flex flex-col items-center text-center hover:scale-105 hover:border-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-300 group">
            <span className="text-5xl font-bold text-white group-hover:text-brand-400 transition-colors mb-4">50+</span>
            <p className="text-zinc-400 text-lg">Community Events</p>
          </div>
          {/* Stat 2 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/10 flex flex-col items-center text-center hover:scale-105 hover:border-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-300 group">
            <span className="text-5xl font-bold text-white group-hover:text-brand-400 transition-colors mb-4">10k+</span>
            <p className="text-zinc-400 text-lg">Active Members</p>
          </div>
          {/* Stat 3 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/10 flex flex-col items-center text-center hover:scale-105 hover:border-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-300 group">
            <span className="text-5xl font-bold text-white group-hover:text-brand-400 transition-colors mb-4">100+</span>
            <p className="text-zinc-400 text-lg">Projects Launched</p>
          </div>
        </div>
      </div>
    </section>
  );
}
