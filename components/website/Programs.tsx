import React from "react";
import { Users, Code2, Rocket, Trophy, HeartHandshake, Globe } from "lucide-react";


const programs = [
    {
        title: "Student Lead",
        desc: "Lead the tech revolution at your campus. Organize events, build communities, and empower peers.",
        icon: <Users className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Open Fellowship",
        desc: "3-month remote fellowship for top builders to work on high-impact open source projects.",
        icon: <Code2 className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Startup Incubator",
        desc: "For idea-stage founders. We provide credits, mentorship, and a network to launch.",
        icon: <Rocket className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Hackathon League",
        desc: "Compete in our national hackathon circuit. Win prizes and get recognized.",
        icon: <Trophy className="w-6 h-6 text-zinc-400" />
    },
     {
        title: "Mentorship",
        desc: "1:1 guidance from industry veterans to help you navigate your career path.",
        icon: <HeartHandshake className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "City Chapters",
        desc: "Join local chapters in your city. Meetups, workshops, and networking events.",
        icon: <Globe className="w-6 h-6 text-zinc-400" />
    }
]

export function Programs() {
  return (
    <section id="programs" className="py-10 relative overflow-hidden">
       <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto mb-20 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">Programs designed for <br/> every stage of your journey.</h2>
            <p className="text-zinc-400 text-lg">Whether you are a student, a builder, or a founder, we have a place for you.</p>
        </div>
        
        {/* 6-Item Grid Layout - Matches WhatWeDo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-7xl mx-auto border-t border-l border-white/10 relative">


            {programs.map((program, idx) => (
                <div key={idx} className="group p-8 border-b border-r border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors relative">
                    <div className="mb-6">{program.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-3 relative z-10">{program.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed relative z-10">
                        {program.desc}
                    </p>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}


