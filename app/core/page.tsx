"use client";

import { signOut, useSession } from "next-auth/react";
import React, { useState } from "react";
import { 
    BookOpen, Calendar, Layers, FileText, Briefcase, 
    Handshake, Users, Settings, Plus, Search,
     Beaker, History, Film, Megaphone, Zap as ZapIcon,
    LogOut, User as UserIcon, Lock, LayoutDashboard, BarChart3, ClipboardList
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Types
interface ResourceItem {
    title: string;
    key: string; // Permission Key
    icon: React.ReactNode;
    items: string[];
    link: string;
    description?: string;
    image?: string;
}

// World Clock Component
function WorldClock() {
    const [time, setTime] = useState<Date | null>(null);

    React.useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const zones = [
        { label: 'NY', zone: 'America/New_York' },
        { label: 'LDN', zone: 'Europe/London' },
        { label: 'IST', zone: 'Asia/Kolkata' },
        { label: 'TYO', zone: 'Asia/Tokyo' },
    ];

    if (!time) return null; // Or return a skeleton

    return (
        <div className="flex items-center gap-3">
            {zones.map((z) => (
                <div key={z.label} className="text-center">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 max-md:hidden">{z.label}</div>
                    <div className="text-xs font-mono text-zinc-300 bg-white/5 border border-white/5 px-2 py-1 rounded">
                        {time.toLocaleTimeString('en-US', { 
                            timeZone: z.zone, 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function CorePage() {
    const { data: session } = useSession();

    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermissions = (session?.user as any)?.permissions || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    const checkAccess = (key: string) => {
        if (isSuperAdmin) return true;
        const perm = userPermissions[key] || userPermissions['*'];
        return perm === 'READ' || perm === 'WRITE' || perm === 'FULL_ACCESS'; 
    };

    const resources: ResourceItem[] = [
        // Row 1: Guides & Playbooks
        { 
            title: "Playbooks", 
            key: "playbooks",
            link: "/core/playbooks",
            icon: <BookOpen />,
            description: "Manage standard operating procedures and governance documentation.",
            image: "/images/dashboard/planning.png",
            items: []
        },
        { 
            title: "Events", 
            key: "events", 
            link: "/core/events", 
            icon: <Calendar />, 
            description: "Coordinate meetups, conferences, and community gatherings.",
            image: "/images/dashboard/planning.png",
            items: [] 
        },
        { 
            title: "Programs", 
            key: "programs", 
            link: "/core/programs", 
            icon: <Layers />, 
            description: "Oversee recurring initiatives, mentorships, and long-term series.",
            image: "/images/dashboard/planning.png",
            items: [] 
        },
        { 
            title: "Content", 
            key: "content", 
            link: "/core/content", 
            icon: <FileText />, 
            description: "Organize content strategy, resources, and publishing workflows.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        
        // Row 2: Ops & Media
        { 
            title: "Operations", 
            key: "operations", 
            link: "/core/operations", 
            icon: <Settings />, 
            description: "Track internal tasks, logistics, and operational workflows.",
            image: "/images/dashboard/data.png",
            items: [] 
        },
        { 
            title: "Experiment", 
            key: "experiments", 
            link: "/core/experiments", 
            icon: <Beaker />, 
            description: "Propose and track new ideas, pilots, and governance proposals.",
            image: "/images/dashboard/data.png",
            items: [] 
        },
         { 
            title: "Media", 
            key: "media", 
            link: "/core/media", 
            icon: <Film />, 
            description: "Manage media assets, posts, and digital distribution.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        { 
            title: "Members Details", 
            key: "members", 
            link: "/core/members", 
            icon: <Users />, 
            description: "Manage community members, roles, and access permissions.",
            image: "/images/dashboard/community.png",
            items: [] 
        },

        // Row 3: Projects & System
        { 
            title: "Projects", 
            key: "projects", 
            link: "/core/projects", 
            icon: <Briefcase />, 
            description: "Manage active projects, deliverables, and milestones.",
            image: "/images/dashboard/data.png",
            items: [] 
        },
        { 
            title: "Partners", 
            key: "partners", 
            link: "/core/partners", 
            icon: <Handshake />, 
            description: "Track sponsors, vendors, and strategic alliances.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        { 
            title: "Mediakit", 
            key: "mediakit", 
            link: "/core/mediakit", 
            icon: <Megaphone />, 
            description: "Access brand assets, press kits, and promotional materials.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        { 
            title: "Logs", 
            key: "logs", 
            link: "/core/logs", 
            icon: <History />, 
            description: "Audit system activities, user actions, and change logs.",
            image: "/images/dashboard/data.png",
            items: [] 
        },

    ];

    return (
    <div className="min-h-screen pt-24 px-6 md:px-12 container mx-auto text-white pb-20">
        
        {/* Header */}
        <header className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">System Online</span>
                 </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                    Core Terminal
                </h1>
                <p className="text-zinc-500 font-medium text-sm mt-2 max-w-lg leading-relaxed">
                    Welcome back, <span className="text-white">{session?.user?.name?.split(' ')[0] || 'User'}</span>. Access your mission control for operations, content, and community management.
                </p>
            </div>
            
            <div className="flex items-center gap-6">
                 <div className="hidden md:block">
                     <WorldClock />
                 </div>
                <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                    {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10">
                             <Image src={session.user.image} alt="Profile" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center ring-2 ring-white/10">
                             <UserIcon className="w-5 h-5 text-zinc-400" />
                        </div>
                    )}
                    <Link 
                        href="/member/profile"
                        className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center text-zinc-400 hover:text-white"
                        title="My Profile"
                    >
                        <Settings className="w-4 h-4" />
                    </Link>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/public' })}
                        className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center text-red-400 hover:text-red-300"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>

        {/* Quick Actions Row */}
        <div className="mb-12">
             <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ZapIcon className="w-4 h-4" /> Quick Actions
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:gap-4">
                 {/* Applications */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-brand-500/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-brand-500/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/applications')}>
                     <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-500 transition-colors">
                        <ClipboardList className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-zinc-400 group-hover:text-brand-400">Applications</span>
                 </button>

                 {/* Announcements */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-brand-500/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-brand-500/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/announcements')}>
                     <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-500 transition-colors">
                        <Megaphone className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-zinc-400 group-hover:text-brand-400">Announcements</span>
                 </button>

                 {/* Attendance */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-brand-500/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-brand-500/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/attendance')}>
                     <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-500 transition-colors">
                        <Users className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-zinc-400 group-hover:text-brand-400">Attendance</span>
                 </button>

                 {/* Meeting Notes */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-brand-500/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-brand-500/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/notes')}>
                     <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-500 transition-colors">
                        <FileText className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-zinc-400 group-hover:text-brand-400">Meeting Notes</span>
                 </button>

                 {/* New Poll */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-brand-500/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-brand-500/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/poll')}>
                     <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-500 transition-colors">
                        <BarChart3 className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-zinc-400 group-hover:text-brand-400">Vote / Polls</span>
                 </button>

                 {/* Manage Team */}
                 {isSuperAdmin && (
                     <button className="lg:flex-1 group flex items-center gap-3 p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-brand-500/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-brand-500/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/admin')}>
                         <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-500 transition-colors">
                            <Settings className="w-5 h-5" />
                         </div>
                         <span className="text-sm font-bold text-zinc-400 group-hover:text-brand-400">Manage Team</span>
                     </button>
                 )}
             </div>
        </div>
        
        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resources.map((resource, idx) => {
                const isLocked = !checkAccess(resource.key);
                return (
                    <ResourceCard 
                        key={idx} 
                        resource={resource}
                        isLocked={isLocked}
                    />
                );
            })}
        </div>
    </div>
  );
}

function ResourceCard({ resource, isLocked }: { resource: ResourceItem, isLocked: boolean }) {
    return (
        <Link 
            href={isLocked ? '#' : resource.link}
            className={`block h-full relative group ${isLocked ? 'cursor-not-allowed' : ''}`}
            onClick={(e) => isLocked && e.preventDefault()}
        >
            <div className={`
                h-full bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden flex flex-col transition-all duration-300
                ${isLocked ? 'opacity-50 grayscale hover:opacity-60' : 'hover:border-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/5 hover:-translate-y-1 hover:bg-zinc-900/40'}
            `}>
                {/* Sleek Image Header */}
                <div className="h-32 relative w-full overflow-hidden border-b border-white/5 bg-zinc-900/20 flex items-center justify-center group-hover:bg-brand-500/[0.02] transition-colors duration-500">
                    
                    {/* Centered Main Icon (No Box) */}
                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl">
                         {React.cloneElement(resource.icon as React.ReactElement<{ className?: string }>, { className: "w-12 h-12 text-zinc-500 group-hover:text-brand-500 transition-colors duration-300" })}
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        {/* Removed duplicate icon here */}
                        <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors duration-300">
                            {resource.title}
                        </h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 group-hover:text-zinc-400 transition-colors">
                        {resource.description || "Access and manage resources."}
                    </p>
                </div>
            </div>

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-2xl border border-white/5">
                    <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-300">
                        <div className="p-4 rounded-full bg-black/50 border border-white/10 shadow-2xl">
                            <Lock className="w-6 h-6 text-zinc-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-black/80 px-3 py-1 rounded border border-white/5">
                            Access Denied
                        </span>
                    </div>
                </div>
            )}
        </Link>
    )
}
