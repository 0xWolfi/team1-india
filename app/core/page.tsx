"use client";

import { signOut, useSession } from "next-auth/react";
import React, { useState } from "react";
import { MotionIcon } from "motion-icons-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Team1Logo } from "@/components/Team1Logo";
import { UnifiedDashboardHeader } from "@/components/UnifiedDashboardHeader";

// Types
interface ResourceItem {
    title: string;
    key: string; // Permission Key
    iconName: string;
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
        { label: 'IST', zone: 'Asia/Kolkata' },
        { label: 'UTC', zone: 'UTC' },
        { label: 'EST', zone: 'America/New_York' },
        { label: 'PST', zone: 'America/Los_Angeles' },
        { label: 'CET', zone: 'Europe/Paris' },
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
            iconName: "BookOpen",
            description: "Manage standard operating procedures and governance documentation.",
            image: "/images/dashboard/planning.png",
            items: []
        },
        { 
            title: "Events", 
            key: "events", 
            link: "/core/events", 
            iconName: "Calendar", 
            description: "Coordinate meetups, conferences, and community gatherings.",
            image: "/images/dashboard/planning.png",
            items: [] 
        },
        { 
            title: "Programs", 
            key: "programs", 
            link: "/core/programs", 
            iconName: "Layers", 
            description: "Oversee recurring initiatives, mentorships, and long-term series.",
            image: "/images/dashboard/planning.png",
            items: [] 
        },
        { 
            title: "Content", 
            key: "content", 
            link: "/core/content", 
            iconName: "FileText", 
            description: "Organize content strategy, resources, and publishing workflows.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        
        // Row 2: Ops & Media
        { 
            title: "Operations", 
            key: "operations", 
            link: "/core/operations", 
            iconName: "Settings", 
            description: "Track internal tasks, logistics, and operational workflows.",
            image: "/images/dashboard/data.png",
            items: [] 
        },
        { 
            title: "Experiment", 
            key: "experiments", 
            link: "/core/experiments", 
            iconName: "Beaker", 
            description: "Propose and track new ideas, pilots, and governance proposals.",
            image: "/images/dashboard/data.png",
            items: [] 
        },
         { 
            title: "Media", 
            key: "media", 
            link: "/core/media", 
            iconName: "Film", 
            description: "Manage media assets, posts, and digital distribution.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        { 
            title: "Members Details", 
            key: "members", 
            link: "/core/members", 
            iconName: "Users", 
            description: "Manage community members, roles, and access permissions.",
            image: "/images/dashboard/community.png",
            items: [] 
        },

        // Bounty Management
        {
            title: "Bounties",
            key: "bounty",
            link: "/core/bounty",
            iconName: "Zap",
            description: "Manage bounties, review submissions, and track XP rewards.",
            image: "/images/dashboard/data.png",
            items: []
        },

        // Row 3: Projects & System
        {
            title: "Projects",
            key: "projects", 
            link: "/core/projects", 
            iconName: "Briefcase", 
            description: "Manage active projects, deliverables, and milestones.",
            image: "/images/dashboard/data.png",
            items: [] 
        },
        { 
            title: "Partners", 
            key: "partners", 
            link: "/core/partners", 
            iconName: "Handshake", 
            description: "Track sponsors, vendors, and strategic alliances.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        { 
            title: "Mediakit", 
            key: "mediakit", 
            link: "/core/mediakit", 
            iconName: "Megaphone", 
            description: "Access brand assets, press kits, and promotional materials.",
            image: "/images/dashboard/community.png",
            items: [] 
        },
        { 
            title: "Logs", 
            key: "logs", 
            link: "/core/logs", 
            iconName: "History", 
            description: "Audit system activities, user actions, and change logs.",
            image: "/images/dashboard/data.png",
            items: [] 
        },

    ];

    return (
    <div className="min-h-[100svh] text-white pb-20">
        
        {/* Mobile Sticky Nav */}
        <div className="md:hidden sticky top-0 z-50 w-full px-6 py-3 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                     <Team1Logo className="w-4 h-4" />
                 <span className="font-bold text-lg tracking-tight text-white">Team1</span>
            </div>
            
            <div className="flex items-center gap-3">
                 {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                             <Image src={session.user.image} alt="Profile" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ring-1 ring-white/10">
                             <MotionIcon name="User" className="w-4 h-4 text-zinc-400" />
                        </div>
                    )}
                <Link 
                    href="/core/profile"
                    className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400"
                >
                    <MotionIcon name="Settings" className="w-4 h-4" />
                </Link>
                <button 
                    onClick={() => signOut({ callbackUrl: '/public' })}
                    className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500"
                >
                    <MotionIcon name="LogOut" className="w-4 h-4" />
                </button>
            </div>
        </div>

        <main className="container mx-auto px-6 md:px-12 md:pt-24 pt-8">
        {/* Header */}
        <UnifiedDashboardHeader 
            title="Core Terminal"
            subtitle={<>Welcome back, <span className="text-white">{session?.user?.name?.split(' ')[0] || 'User'}</span>. Access your mission control for operations, content, and community management.</>}
            user={session?.user}
            backLink="/public"
        >
             <div className="hidden md:block">
                 <WorldClock />
             </div>
        </UnifiedDashboardHeader>

        {/* Quick Actions Row */}
        <div className="mb-12">
             <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <MotionIcon name="Zap" className="w-4 h-4" /> Quick Actions
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:gap-4 gap-3">
                 {/* Applications */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-3 md:p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/applications')}>
                     <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <MotionIcon name="ClipboardList" className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white truncate">Applications</span>
                 </button>

                 {/* Announcements */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-3 md:p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/announcements')}>
                     <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <MotionIcon name="Megaphone" className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white truncate">Announcements</span>
                 </button>

                 {/* Attendance */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-3 md:p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/attendance')}>
                     <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <MotionIcon name="Users" className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white truncate">Attendance</span>
                 </button>

                 {/* Meeting Notes */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-3 md:p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/notes')}>
                     <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <MotionIcon name="FileText" className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white truncate">Meeting Notes</span>
                 </button>

                 {/* New Poll */}
                 <button className="lg:flex-1 group flex items-center gap-3 p-3 md:p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/poll')}>
                     <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                        <MotionIcon name="BarChart3" className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white truncate">Vote / Polls</span>
                 </button>

                 {/* Manage Team */}
                 {isSuperAdmin && (
                     <button className="lg:flex-1 group flex items-center gap-3 p-3 md:p-4 bg-zinc-900/20 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/20 hover:bg-zinc-900/40 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all hover:-translate-y-0.5" onClick={() => router.push('/core/admin')}>
                         <div className="p-1.5 md:p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                            <MotionIcon name="Settings" className="w-4 h-4 md:w-5 md:h-5" />
                         </div>
                         <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white truncate">Manage Team</span>
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
        </main>
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
                ${isLocked ? 'opacity-50 grayscale hover:opacity-60' : 'hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-1 hover:bg-zinc-900/40'}
            `}>
                {/* Sleek Image Header */}
                <div className="h-32 relative w-full overflow-hidden border-b border-white/5 bg-zinc-900/20 flex items-center justify-center group-hover:bg-white/[0.02] transition-colors duration-500">
                    
                    {/* Centered Main Icon (No Box) */}
                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl">
                         <MotionIcon name={resource.iconName} className="w-12 h-12 text-zinc-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        {/* Removed duplicate icon here */}
                        <h3 className="text-base font-bold text-white group-hover:text-white transition-colors duration-300">
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
                            <MotionIcon name="Lock" className="w-6 h-6 text-zinc-500" />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-black/80 px-3 py-1 rounded border border-white/10">
                            Access Denied
                        </span>
                    </div>
                </div>
            )}
        </Link>
    )
}
