import React from "react";
import { MoveRight, Zap, Users, Shield, TrendingUp, Rocket, Calendar } from "lucide-react";


const cards = [
    {
        title: "Idea Phase Accelerator",
        desc: "We help idea-stage startups find product-market fit. Get funding, mentorship, and resources.",
        icon: <Rocket className="w-6 h-6 text-zinc-400" />,
        colSpan: "md:col-span-1",
    },
    {
        title: "Community",
        desc: "Vibrant ecosystem of builders and creators sharing knowledge.",
        icon: <Users className="w-6 h-6 text-zinc-400" />,
        colSpan: "md:col-span-1",
    },
    {
        title: "Marketing",
        desc: "Growth strategies and visibility for your launch.",
        icon: <TrendingUp className="w-6 h-6 text-zinc-400" />,
        colSpan: "md:col-span-1",
    },
    {
        title: "Dev Onboarding",
        desc: "Helping developers get started with the right tech stack.",
        icon: <Zap className="w-6 h-6 text-zinc-400" />,
        colSpan: "md:col-span-1",
    },
    {
        title: "Closed Beta",
        desc: "Test your product with a curated group of early adopters.",
        icon: <Shield className="w-6 h-6 text-zinc-400" />,
        colSpan: "md:col-span-1",
    },
    {
        title: "Events",
        desc: "High-energy hackathons and meetups.",
        icon: <Calendar className="w-6 h-6 text-zinc-400" />,
        colSpan: "md:col-span-1",
    }
];

export function WhatWeDo() {
  return (
    <section id="what-we-do" className="py-10">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto mb-16 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">Built for impact. <br/> Designed for builders.</h2>
            <p className="text-zinc-400 text-lg">From idea to scale, Team1India provides the infrastructure, network, and resources you need.</p>
        </div>

        {/* 6-Item Grid Layout - 3 Columns x 2 Rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-7xl mx-auto border-t border-l border-white/10 relative">


             {cards.map((card, idx) => (
                 <div key={idx} className={`p-8 border-b border-r border-white/10 relative group ${card.colSpan} bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300`}>
                     <div className="flex items-center gap-4 mb-3 relative z-10">
                        {card.icon}
                        <h3 className="text-xl font-bold text-white">{card.title}</h3>
                     </div>
                    <p className="text-zinc-500 text-sm leading-relaxed relative z-10">
                      {card.desc}
                    </p>
                  </div>
             ))}

        </div>
      </div>
    </section>
  );
}


