"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Book, Code2, Users, Calendar, Trophy, ExternalLink, Clock } from "lucide-react";

import PublicHero from "@/components/public/PublicHero";
import { Announcements } from "@/components/website/Announcements";
import { FloatingNav } from "@/components/public/FloatingNav";
import SectionCarousel from "@/components/public/SectionCarousel";
import PublicContactSection from "@/components/public/PublicContactSection";
import { Program, Event, Guide } from "@/types/public";
import { ApplicationForm } from "@/components/public/ApplicationForm";
import { Footer } from "@/components/website/Footer";
import { PublicEventCalendar } from "@/components/calendar/PublicEventCalendar";
import { EventGrid } from "@/components/website/EventGrid";

type PublicHomePayload = {
    playbooks: any[];
    programs: Program[];
    guides: Guide[];
    events: Event[];
    upcomingEvents: any[]; // Luma events
    mediaItems: any[];
};

export default function PublicPage() {
    const [data, setData] = useState<PublicHomePayload>({
        playbooks: [],
        programs: [],
        guides: [],
        events: [],
        upcomingEvents: [],
        mediaItems: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/public/home", { cache: "no-store" });
                if (!res.ok) throw new Error(await res.text());
                const json = await res.json();
                if (!cancelled) {
                    setData(json);
                    setIsLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setData({ playbooks: [], programs: [], guides: [], events: [], upcomingEvents: [], mediaItems: [] });
                    setIsLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const { playbooks, programs, guides, events, upcomingEvents, mediaItems } = data;

    return (
        <main className="h-[100dvh] w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory md:h-auto md:w-auto md:overflow-visible md:snap-none text-white selection:bg-zinc-800 selection:text-zinc-200 supports-[height:100svh]:h-[100svh]">
            <FloatingNav />
            
            <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
                {/* Added pb-32 to push hero up slightly when centered */}
                <div 
                    className="min-h-[100dvh] snap-center flex flex-col justify-center items-center pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] md:min-h-[85vh] md:items-stretch md:pb-16"
                    style={{ scrollSnapStop: 'always' }}
                >
                    <PublicHero />
                    <div className="relative z-10 -mt-12 md:-mt-32">
                         <Announcements />
                    </div>
                </div>


                {/* Upcoming Events (Luma) Section */}
                <section 
                    id="upcoming-events" 
                    className="min-h-[100dvh] snap-center flex flex-col justify-center items-center py-8 pb-[calc(8rem+env(safe-area-inset-bottom))] relative scroll-mt-24 md:min-h-0 md:block md:py-8"
                    style={{ scrollSnapStop: 'always' }}
                >
                    <div className="container mx-auto px-6 relative z-10 w-full">
                        {/* Section Header */}
                        <div className="flex flex-col items-center text-center md:flex-row md:items-end md:text-left justify-between mb-8 gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                                    Attend
                                </h2>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    Upcoming meetups and hackathons.
                                </p>
                            </div>
                            
                            {/* Desktop See All Button */}
                            <Link 
                                href="https://lu.ma/Team1India" 
                                target="_blank"
                                className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-all"
                            >
                                See All
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Event Grid */}
                        <EventGrid initialEvents={upcomingEvents || []} />

                    </div>
                </section>




                {/* Playbooks */}
                <SectionCarousel 
                    id="playbooks"
                    title="Playbooks" 
                    description="Essential rules, guidelines, and strategies to help you build and scale."
                    seeAllLink="/public/playbooks"
                    enableScroll={playbooks.length > 3}
                    isEmpty={playbooks.length === 0}
                >
                    {playbooks.length > 0 ? playbooks.map((item: any) => (
                        <Link key={item.id} href={`/public/playbooks/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group">
                            <div className="h-36 w-full bg-zinc-800 relative overflow-hidden">
                                {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                        <Book className="w-10 h-10 text-zinc-600 group-hover:text-zinc-400" />
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">{item.title}</h3>
                                {item.description && <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4 flex-1">{item.description}</p>}
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">Read Playbook</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div className="w-full py-16 rounded-3xl bg-zinc-900/20 border border-white/5 flex items-center justify-center">
                            <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm">Announcing Soon</p>
                        </div>
                    )}
                </SectionCarousel>

                {/* Programs */}
                <SectionCarousel 
                    id="programs"
                    title="Programs" 
                    description="Initiatives to accelerate your growth."
                    seeAllLink="/public/programs"
                    direction="right"
                    enableScroll={programs.length > 3}
                    isEmpty={programs.length === 0}
                >
                    {programs.length > 0 ? programs.map((item: any) => (
                        <Link key={item.id} href={`/public/programs/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group cursor-pointer">
                            <div className="h-36 w-full bg-zinc-800 relative overflow-hidden flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                            {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                                ) : (
                                    <Users className="w-10 h-10 text-zinc-600 group-hover:text-zinc-400" />
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">{item.title}</h3>
                                {item.description && <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4 flex-1">{item.description}</p>}
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">View Program</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div className="w-full py-16 rounded-3xl bg-zinc-900/20 border border-white/5 flex items-center justify-center">
                            <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm">Announcing Soon</p>
                        </div>
                    )}
                </SectionCarousel>

                {/* Content (Guides/Bounties) */}
                <SectionCarousel 
                    id="content"
                    title="Content" 
                    description="Earn bounties by contributing."
                    seeAllLink="/public/content"
                    seeAllText="See All"
                    enableScroll={guides.length > 3}
                    isEmpty={guides.length === 0}
                >
                    {guides.length > 0 ? guides.map((item: any) => (
                        <Link key={item.id} href={`/public/guides/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group">
                            <div className="h-36 w-full bg-zinc-800 relative overflow-hidden flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                                ) : (
                                    <Trophy className="w-10 h-10 text-zinc-600 group-hover:text-zinc-400" />
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-2">
                                     <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase text-zinc-400 border border-white/5">{item.type || 'Guide'}</span>
                                </div>
                                <h3 className="font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">{item.title}</h3>
                                <div className="flex-1" /> {/* Spacer */}
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">View Bounty</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div className="w-full py-16 rounded-3xl bg-zinc-900/20 border border-white/5 flex items-center justify-center">
                            <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm">Announcing Soon</p>
                        </div>
                    )}
                </SectionCarousel>




                {/* Events (Internal/Legacy) */}
                <SectionCarousel 
                    id="events"
                    title="Events" 
                    description="Wanna host? 'Cause all things here are for people who can host."
                    seeAllLink="/public/events"
                    direction="right"
                    enableScroll={events.length > 3}
                    isEmpty={events.length === 0}
                >
                    {events.length > 0 ? events.map((item: any) => (
                         <Link key={item.id} href={`/public/events/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group">
                            <div className="h-36 w-full bg-zinc-800 relative overflow-hidden">
                                 {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                        <Calendar className="w-10 h-10 text-zinc-600 group-hover:text-zinc-400" />
                                    </div>
                                 )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> {item.date ? (() => {
                                        try {
                                            const dateStr = typeof item.date === 'string' ? item.date : item.date?.toString();
                                            if (!dateStr) return 'TBA';
                                            const date = new Date(dateStr);
                                            return isNaN(date.getTime()) ? 'TBA' : date.toLocaleDateString();
                                        } catch {
                                            return 'TBA';
                                        }
                                    })() : 'TBA'}
                                </div>
                                <h3 className="font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-zinc-200 transition-colors">{item.title}</h3>
                                {item.location && <p className="text-sm text-zinc-500 mb-4 flex-1">{item.location}</p>}
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">View Details</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                         </Link>
                    )) : (
                        <div className="w-full py-16 rounded-3xl bg-zinc-900/20 border border-white/5 flex items-center justify-center">
                            <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm">Announcing Soon</p>
                        </div>
                    )}
                </SectionCarousel>



                <PublicContactSection mediaItems={mediaItems} />
            </div>
            
            <Footer />
        </main>
    );
}
