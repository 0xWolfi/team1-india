"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Globe, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Footer } from "@/components/website/Footer";
import { ApplicationForm } from "@/components/public/ApplicationForm";
import ReactMarkdown from 'react-markdown';

import { Guide, FormField } from "@/types/public";

export default function PublicGuidePage() {
    const { id } = useParams();
    const router = useRouter();
    const [guide, setGuide] = useState<Guide | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Fetch guide data
    useEffect(() => {
        if (!id) return;
        
        const fetchGuide = async () => {
            try {
                const res = await fetch(`/api/public/guides/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGuide(data);
                } else {
                    setError('Guide not found or not accessible');
                }
            } catch (err) {
                setError('Failed to load guide');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchGuide();
    }, [id]);
    
    // Normalize form schema
    const formFields: FormField[] = useMemo(() => {
        if (!guide?.formSchema) return [];
        if (Array.isArray(guide.formSchema)) return guide.formSchema;
        // Legacy support
        return Object.entries(guide.formSchema).map(([key, label]) => ({
            id: key,
            key,
            label: label as string,
            type: 'text',
            required: true
        }));
    }, [guide]);

    if (isLoading) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
                <Globe className="w-8 h-8 text-indigo-500 animate-spin-slow"/>
                <span className="text-zinc-500 text-sm">Loading Guide...</span>
            </div>
        </div>
    );

    if (error || !guide) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
             <div className="text-center">
                <h1 className="text-2xl font-bold mb-2 text-white">Error</h1>
                <p className="text-zinc-500">{error || "Something went wrong"}</p>
                 <Link href="/public" className="mt-4 inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2"/> Back to Directory
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Header / Nav */}
            <div className="pt-8 px-6 max-w-6xl mx-auto">
                 <Link href="/public" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors px-4 py-2 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5">
                    <ArrowLeft className="w-4 h-4"/> Back to Directory
                </Link>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-12">
                            
                            {/* Title & Cover */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/10">
                                            {guide.type} Guide
                                        </span>
                                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                                            <Clock className="w-3 h-3"/> Updated {formatDistanceToNow(new Date(guide.updatedAt))} ago
                                        </span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">{guide.title}</h1>
                                </div>

                                {guide.coverImage && (
                                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                        <img 
                                            src={guide.coverImage} 
                                            alt={guide.title} 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Description and Markdown Content */}
                            <section>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                     Overview
                                </h2>
                                {guide.body?.markdown ? (
                                    <div className="prose prose-invert prose-zinc max-w-none">
                                        <ReactMarkdown>{guide.body.markdown}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                                        {guide.body?.description || "No description provided."}
                                    </p>
                                )}
                            </section>

                            {/* KPIs */}
                            {guide.body?.kpis && guide.body.kpis.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        Success Metrics
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {guide.body.kpis.map((kpi, idx) => (
                                            <div key={idx} className="bg-zinc-900/50 border border-white/10 p-5 rounded-xl text-center">
                                                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">{kpi.label}</div>
                                                <div className="text-2xl md:text-3xl font-bold text-white break-words">{kpi.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Timeline */}
                            {guide.body?.timeline && guide.body.timeline.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        Timeline
                                    </h2>
                                    <div className="space-y-6 relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-white/10 pl-2">
                                        {guide.body.timeline.map((item, idx) => (
                                            <div key={idx} className="relative pl-12">
                                                <div className="absolute left-0 top-1 w-[40px] h-[40px] bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center z-10 shadow-lg shadow-black">
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                </div>
                                                <h3 className="text-white font-bold text-lg">{item.step}</h3>
                                                <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                                                    <Clock className="w-3 h-3"/> Duration: {item.duration}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Rules */}
                             {guide.body?.rules && guide.body.rules.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        Guidelines
                                    </h2>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {guide.body.rules.map((rule, idx) => (
                                            <li key={idx} className="flex gap-4 text-base text-zinc-400 bg-white/[0.02] p-4 rounded-xl border border-white/5 items-start">
                                                <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/>
                                                <span>{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        {/* Sidebar Application Form */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <ApplicationForm programId={guide.id} formSchema={formFields} />
                            </div>
                        </div>
                    </div>

            </div>
            <Footer />
        </div>
    );
}
