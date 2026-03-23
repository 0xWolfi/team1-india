"use client";

import React from 'react';
import { Globe, Handshake, Rocket, Send, Twitter } from "lucide-react";
import Link from 'next/link';

interface Project {
    id: string;
    name: string;
    logo?: string | null;
    website?: string | null;
    twitter?: string | null;
    telegram?: string | null;
}

interface Partner {
    id: string;
    name: string;
    type?: string | null;
    logo?: string | null;
    website?: string | null;
    twitter?: string | null;
    telegram?: string | null;
}

interface PublicCommunitySectionProps {
    projects: Project[];
    partners: Partner[];
}

export default function PublicCommunitySection({ projects, partners }: PublicCommunitySectionProps) {
    if (projects.length === 0 && partners.length === 0) return null;

    const SocialLinks = ({ item }: { item: Project | Partner }) => (
        <div className="flex gap-3 mt-4">
            {item.website && (
                <Link href={item.website} target="_blank" className="text-zinc-500 hover:text-white transition-colors">
                    <Globe className="w-4 h-4"/>
                </Link>
            )}
            {item.twitter && (
                <Link href={item.twitter} target="_blank" className="text-zinc-500 hover:text-blue-400 transition-colors">
                    <Twitter className="w-4 h-4"/>
                </Link>
            )}
            {item.telegram && (
                <Link href={item.telegram} target="_blank" className="text-zinc-500 hover:text-sky-400 transition-colors">
                    <Send className="w-4 h-4"/>
                </Link>
            )}
        </div>
    );

    return (
        <div className="space-y-20">
            {/* Projects Section */}
            {projects.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Rocket className="w-5 h-5 text-indigo-400"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Community Projects</h2>
                            <p className="text-zinc-400 text-sm">Initiatives built by our members.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <div key={project.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {project.logo ? (
                                            <img src={project.logo} alt={project.name} className="w-12 h-12 rounded-xl object-cover bg-black" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-xl font-bold text-zinc-500 uppercase">
                                                {project.name.substring(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                                        </div>
                                    </div>
                                </div>
                                <SocialLinks item={project} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Partners Section */}
            {partners.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Handshake className="w-5 h-5 text-emerald-400"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Partners & Ecosystem</h2>
                            <p className="text-zinc-400 text-sm">Organizations supporting our mission.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {partners.map(partner => (
                            <div key={partner.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all flex flex-col items-center text-center group">
                                {partner.logo ? (
                                    <img src={partner.logo} alt={partner.name} className="w-16 h-16 rounded-full object-cover bg-black mb-4 border border-white/5" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-xl font-bold text-zinc-500 uppercase mb-4">
                                        {partner.name.substring(0, 2)}
                                    </div>
                                )}
                                
                                <h3 className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{partner.name}</h3>
                                {partner.type && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-1 rounded-full mb-3">
                                        {partner.type}
                                    </span>
                                )}
                                <div className="mt-auto">
                                    <SocialLinks item={partner} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
