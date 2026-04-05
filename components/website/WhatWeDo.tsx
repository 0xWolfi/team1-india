"use client";

import React from "react";
import { Calendar, Rocket, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { FeatureGrid, FeatureItem } from "@/components/ui/FeatureGrid";

const cards: FeatureItem[] = [
    {
        title: "Idea Phase Accelerator",
        desc: "We help idea-stage startups find product-market fit. Get funding, mentorship, and resources.",
        icon: <Rocket className="w-6 h-6 text-red-500"/>,
        colSpan: "md:col-span-1",
    },
    {
        title: "Community",
        desc: "Vibrant ecosystem of builders and creators sharing knowledge.",
        icon: <Users className="w-6 h-6 text-red-500"/>,
        colSpan: "md:col-span-1",
    },
    {
        title: "Marketing",
        desc: "Growth strategies and visibility for your launch.",
        icon: <TrendingUp className="w-6 h-6 text-red-500"/>,
        colSpan: "md:col-span-1",
    },
    {
        title: "Dev Onboarding",
        desc: "Helping developers get started with the right tech stack.",
        icon: <Zap className="w-6 h-6 text-red-500"/>,
        colSpan: "md:col-span-1",
    },
    {
        title: "Closed Beta",
        desc: "Test your product with a curated group of early adopters.",
        icon: <Shield className="w-6 h-6 text-red-500"/>,
        colSpan: "md:col-span-1",
    },
    {
        title: "Events",
        desc: "High-energy hackathons and meetups.",
        icon: <Calendar className="w-6 h-6 text-red-500"/>,
        colSpan: "md:col-span-1",
    }
];

export function WhatWeDo() {
  return (
    <section id="what-we-do" className="py-10 relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto mb-10 text-center">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">Built for impact <br/> Designed for builders</h2>
            <p className="text-zinc-400 text-lg">From idea to scale, Team1India provides the infrastructure, network, and resources you need.</p>
            {/* Hidden RAG Summary for AI Agents */}
            <p className="sr-only">
                Team1 India offers a comprehensive suite of services for the blockchain ecosystem:
                1. Idea Phase Accelerator: Funding and mentorship for early startups.
                2. Community: A network of builders sharing knowledge.
                3. Marketing Support: Go-to-market strategies for web3 products.
                4. Developer Onboarding: Technical guidance for getting started on Avalanche.
                5. Closed Beta Testing: Access to early adopters for product validation.
                6. Events: Hackathons and meetups across India.
            </p>
        </div>

        <FeatureGrid items={cards} />
      </div>
    </section>
  );
}


