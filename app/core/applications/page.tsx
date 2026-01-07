'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Check, X, ExternalLink, Calendar, Mail, FileText, Filter, ClipboardList } from 'lucide-react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface Application {
    id: string;
    applicantEmail: string;
    status: string;
    submittedAt: string;
    data: any;
    guide?: { title: string; type: string };
    program?: { title: string };
}

const TABS = [
    { id: 'ALL', label: 'All' },
    { id: 'MEMBERSHIP', label: 'Membership' },
    { id: 'EVENTS', label: 'Events' },
    { id: 'PROGRAMS', label: 'Programs' },
    { id: 'CONTENT', label: 'Content' },
];

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [activeTab, setActiveTab] = useState('ALL');

    useEffect(() => {
        fetch('/api/applications')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setApplications(data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredApps = applications.filter(app => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'MEMBERSHIP') return !app.guide && !app.program;
        if (activeTab === 'EVENTS') return app.guide?.type === 'event';
        if (activeTab === 'PROGRAMS') return app.program || app.guide?.type === 'program';
        if (activeTab === 'CONTENT') return app.guide?.type === 'content';
        return true;
    });

    if (loading) return (
        <CoreWrapper>
             <div className="flex items-center justify-center h-64 text-zinc-500 gap-2">
                <Loader2 className="animate-spin w-5 h-5" /> Loading applications...
            </div>
        </CoreWrapper>
    );

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Applications"
                description="Review and manage incoming membership, program, and event applications."
                icon={<ClipboardList className="w-5 h-5 text-zinc-200" />}
            >
                <div className="text-sm text-zinc-500 font-medium px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                    {filteredApps.length} Pending
                </div>
            </CorePageHeader>

            <div className="space-y-8">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-white/5 pb-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedApp(null); }}
                            className={`px-4 py-2 text-sm font-medium transition-all relative whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'text-white' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* List */}
                    <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                        {filteredApps.length === 0 && (
                            <div className="text-zinc-500 py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                No applications found.
                            </div>
                        )}
                        {filteredApps.map(app => (
                            <div 
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                className={`p-5 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                                    selectedApp?.id === app.id 
                                    ? 'bg-white/[0.03] border-indigo-500/50 shadow-lg shadow-indigo-900/10' 
                                    : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div>
                                        <h3 className={`font-bold text-base ${selectedApp?.id === app.id ? 'text-white' : 'text-zinc-300 group-hover:text-white transition-colors'}`}>
                                            {app.data?.name || 'Unknown Candidate'}
                                        </h3>
                                        {(app.guide || app.program) ? (
                                            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                                                via <span className="text-zinc-400 font-medium truncate max-w-[150px]">{app.guide?.title || app.program?.title}</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-zinc-600 mt-1">General Application</div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full capitalize font-bold tracking-wide ${
                                        app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                        {app.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-1.5 relative z-10">
                                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" /> {app.applicantEmail}
                                    </div>
                                    <div className="text-xs text-zinc-600 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> {new Date(app.submittedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-2">
                        {selectedApp ? (
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 space-y-8 sticky top-24 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl">
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-white/5 pb-8">
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-1">{selectedApp.data?.name}</h2>
                                            <div className="text-base text-zinc-400">{selectedApp.data?.about ? selectedApp.data.about.slice(0, 100) + '...' : 'No bio available'}</div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3 text-sm">
                                             <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-300 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-zinc-500" /> {selectedApp.applicantEmail}
                                             </div>
                                             {selectedApp.data?.telegram && (
                                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-300 flex items-center gap-2">
                                                    <span className="text-zinc-500 text-xs">TG</span> {selectedApp.data.telegram}
                                                </div>
                                             )}
                                             {selectedApp.data?.country && (
                                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-300 flex items-center gap-2">
                                                    <span className="text-zinc-500 text-xs">LOC</span> {selectedApp.data.country}
                                                </div>
                                             )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95" title="Reject">
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hover:scale-105 active:scale-95" title="Approve">
                                            <Check className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        {selectedApp.data?.about && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> About Candidate
                                                </h4>
                                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                                                    {selectedApp.data.about}
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Links & References
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedApp.data?.resumeLink && (
                                                    <a href={selectedApp.data.resumeLink} target="_blank" className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group text-sm">
                                                        <ExternalLink className="w-4 h-4 text-emerald-400" /> 
                                                        <span className="text-emerald-400 group-hover:text-emerald-300 font-medium">Resume / Portfolio</span>
                                                    </a>
                                                )}
                                                {selectedApp.data?.github && (
                                                    <a href={`https://${selectedApp.data.github}`} target="_blank" className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group text-sm">
                                                        <ExternalLink className="w-4 h-4 text-zinc-400" /> 
                                                        <span className="text-zinc-300 group-hover:text-white">GitHub Profile</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                         {selectedApp.data?.skills && (
                                             <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Skills
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedApp.data.skills.split(',').map((s: string, i: number) => (
                                                        <span key={i} className="px-2.5 py-1 bg-indigo-500/10 rounded-lg text-xs font-medium text-indigo-300 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                                                            {s.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                         )}

                                         {/* Q&A Section */}
                                         <div className="space-y-6">
                                             {selectedApp.data?.q_whyJoin && (
                                                 <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Why Join?</h4>
                                                    <p className="text-zinc-400 text-sm italic border-l-2 border-white/10 pl-4 py-1">{selectedApp.data.q_whyJoin}</p>
                                                </div>
                                             )}
                                             {selectedApp.data?.q_howHelp && (
                                                 <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">How to Help?</h4>
                                                    <p className="text-zinc-400 text-sm italic border-l-2 border-white/10 pl-4 py-1">{selectedApp.data.q_howHelp}</p>
                                                </div>
                                             )}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <ClipboardList className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="font-medium">Select an application</p>
                                <p className="text-xs text-zinc-600 mt-1">View details, answers, and approve/reject candidates</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CoreWrapper>
    );
}
