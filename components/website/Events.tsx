import React from "react";

const events = [
    { bg: "bg-gradient-to-br from-purple-500/20 to-blue-500/20" },
    { bg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" },
    { bg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20" },
    { bg: "bg-gradient-to-br from-orange-500/20 to-red-500/20" },
];

export function Events() {
  return (
    <section id="events" className="py-10">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 text-center tracking-tighter">
          Upcoming Events
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
            {[...Array(4)].map((_, idx) => (
                <div key={idx} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/10">
                            <div className="w-6 h-6 rounded-full bg-white/20" />
                         </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
