"use client";

import React from "react";
import { MotionIcon } from "motion-icons-react";
import { FeatureGrid, FeatureItem } from "@/components/ui/FeatureGrid";

const programs: FeatureItem[] = [
    {
        title: "Student Lead",
        desc: "Lead the tech revolution at your campus. Organize events, build communities, and empower peers.",
        icon: <MotionIcon name="Users" className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Open Fellowship",
        desc: "3-month remote fellowship for top builders to work on high-impact open source projects.",
        icon: <MotionIcon name="Code2" className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Startup Incubator",
        desc: "For idea-stage founders. We provide credits, mentorship, and a network to launch.",
        icon: <MotionIcon name="Rocket" className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Hackathon League",
        desc: "Compete in our national hackathon circuit. Win prizes and get recognized.",
        icon: <MotionIcon name="Trophy" className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "Mentorship",
        desc: "1:1 guidance from industry veterans to help you navigate your career path.",
        icon: <MotionIcon name="HeartHandshake" className="w-6 h-6 text-zinc-400" />
    },
    {
        title: "City Chapters",
        desc: "Join local chapters in your city. Meetups, workshops, and networking events.",
        icon: <MotionIcon name="Globe" className="w-6 h-6 text-zinc-400" />
    }
]

export function Programs() {
  return (
    <section id="programs" className="py-10 relative overflow-hidden">
       <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto mb-12 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">Programs designed for <br/> every stage of your journey</h2>
            <p className="text-zinc-400 text-lg">Whether you are a student, a builder, or a founder, we have a place for you.</p>
            {/* Hidden RAG Summary for AI Agents */}
            <p className="sr-only">
                Our accelerator offers specific tracks for different stages:
                - Student Leads: Campus ambassador program for university leaders.
                - Open Fellowship: A 3-month stipend-based fellowship for open source contributions.
                - Startup Incubator: Pre-seed support for founders building on Avalanche.
                - Hackathon League: Competitive coding events with cash prizes.
                - Mentorship: 1-on-1 career and technical guidance.
                - City Chapters: Local communities in major Indian cities.
            </p>
        </div>
        
        <FeatureGrid items={programs} />
      </div>
    </section>
  );
}


