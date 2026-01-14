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

type PublicHomePayload = {
    playbooks: any[];
    programs: Program[];
    guides: Guide[];
    events: Event[];
    mediaItems: any[];
};

export default function PublicPage() {
    const [data, setData] = useState<PublicHomePayload>({
        playbooks: [],
        programs: [],
        guides: [],
        events: [],
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
                    setData({ playbooks: [], programs: [], guides: [], events: [], mediaItems: [] });
                    setIsLoading(false);
                }
                console.error(e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const { playbooks, programs, guides, events, mediaItems } = data;

    return (
        <main className="min-h-screen text-white selection:bg-zinc-800 selection:text-zinc-200">
            <FloatingNav />
            
            <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
                {/* Added pb-32 to push hero up slightly when centered */}
                <div className="min-h-[85vh] flex flex-col justify-center pb-32">
                    <PublicHero />
                    <div className="relative z-10 -mt-12 md:-mt-32">
                         <Announcements />
                    </div>
                </div>


                {/* Playbooks */}
                <SectionCarousel 
                    id="playbooks"
                    title="Playbooks" 
                    description="Essential rules, guidelines, and strategies to help you build and scale."
                    seeAllLink="/public/playbooks"
                    enableScroll={playbooks.length > 3}
                >
                    {playbooks.length > 0 ? playbooks.map((item: any) => (
                        <Link key={item.id} href={`/public/playbooks/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group">
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
                >
                    {programs.length > 0 ? programs.map((item: any) => (
                        <Link key={item.id} href={`/public/programs/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group cursor-pointer">
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
                    seeAllText="View Bounties"
                    enableScroll={guides.length > 3}
                >
                    {guides.length > 0 ? guides.map((item: any) => (
                        <Link key={item.id} href={`/public/guides/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group">
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

                {/* Events */}
                <SectionCarousel 
                    id="events"
                    title="Events" 
                    description="Upcoming meetups and hackathons."
                    seeAllLink="/public/events"
                    direction="right"
                    enableScroll={events.length > 3}
                >
                    {events.length > 0 ? events.map((item: any) => (
                         <Link key={item.id} href={`/public/events/${item.id}`} className="block min-w-[260px] w-[260px] snap-center bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-[300px] group">
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
