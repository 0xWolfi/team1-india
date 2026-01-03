import React from "react";

export function Impact() {
  return (
    <section id="impact" className="py-20 bg-neutral-950">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
          What We Have Done
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat 1 */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <span className="text-5xl font-bold text-blue-500 mb-4">50+</span>
            <p className="text-zinc-400 text-lg">Community Events</p>
          </div>
          {/* Stat 2 */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <span className="text-5xl font-bold text-purple-500 mb-4">10k+</span>
            <p className="text-zinc-400 text-lg">Active Members</p>
          </div>
          {/* Stat 3 */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <span className="text-5xl font-bold text-green-500 mb-4">100+</span>
            <p className="text-zinc-400 text-lg">Projects Launched</p>
          </div>
        </div>
      </div>
    </section>
  );
}
