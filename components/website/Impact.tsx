import React from "react";

export function Impact() {
  return (
    <section id="impact" className="py-10 relative z-10 overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto mb-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">What We Have Done</h2>
            <p className="text-zinc-400 text-lg">Measurable impact across the entire ecosystem.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-5xl mx-auto border-t border-l border-white/10 relative">
          {/* Stat 1 */}
          <div className="p-12 border-b border-r border-white/10 relative group bg-white/5 backdrop-blur-md hover:bg-white/[0.02] flex flex-col items-center text-center transition-all duration-300">
            <span className="text-6xl md:text-7xl font-bold text-white group-hover:text-zinc-200 transition-colors mb-4 tracking-tighter">113</span>
            <p className="text-zinc-400 text-lg font-medium tracking-wide uppercase text-sm">Community Events</p>
          </div>
          
          {/* Stat 2 */}
          <div className="p-12 border-b border-r border-white/10 relative group bg-white/5 backdrop-blur-md hover:bg-white/[0.02] flex flex-col items-center text-center transition-all duration-300">
            <span className="text-6xl md:text-7xl font-bold text-white group-hover:text-zinc-200 transition-colors mb-4 tracking-tighter">7</span>
            <p className="text-zinc-400 text-lg font-medium tracking-wide uppercase text-sm">Hackathons Hosted</p>
          </div>
          
          {/* Stat 3 */}
          <div className="p-12 border-b border-r border-white/10 relative group bg-white/5 backdrop-blur-md hover:bg-white/[0.02] flex flex-col items-center text-center transition-all duration-300">
            <span className="text-6xl md:text-7xl font-bold text-white group-hover:text-zinc-200 transition-colors mb-4 tracking-tighter">31</span>
            <p className="text-zinc-400 text-lg font-medium tracking-wide uppercase text-sm">Projects Building</p>
          </div>
        </div>
      </div>
    </section>
  );
}
