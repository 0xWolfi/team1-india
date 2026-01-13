import React from "react";
import {
    BookOpen, Beaker, Vote, Megaphone, FileText, Users, Calendar, Briefcase, Newspaper
} from "lucide-react";
import Link from "next/link";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { AnnouncementViewer } from "@/components/public/AnnouncementViewer";
import { Announcements } from "@/components/website/Announcements";
import { MemberHeader } from "@/components/member/MemberHeader";
import { IncompleteProfileNotification } from "@/components/member/IncompleteProfileNotification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export default async function MemberPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/public');
    }

    // Check if user has MEMBER or CORE role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any)?.role;
    if (userRole !== 'MEMBER' && userRole !== 'CORE') {
        redirect('/public?error=access_denied');
    }

    const resources = [
        {
            title: "Playbooks",
            link: "/member/playbooks",
            icon: <BookOpen />,
            description: "Access member-only and public playbooks and guides.",
        },
        {
            title: "Events",
            link: "/member/events",
            icon: <Calendar />,
            description: "View member-only and public event guides.",
        },
        {
            title: "Programs",
            link: "/member/programs",
            icon: <Briefcase />,
            description: "Access member-only and public program guides.",
        },
        {
            title: "Content",
            link: "/member/content",
            icon: <Newspaper />,
            description: "Browse member-only and public content guides.",
        },
        {
            title: "Experiments",
            link: "/member/experiments",
            icon: <Beaker />,
            description: "Submit proposals, view status, and participate in discussions.",
        },
        {
            title: "Announcements",
            link: "/member/announcements",
            icon: <Megaphone />,
            description: "View member-only and public announcements.",
        },
        {
            title: "Members",
            link: "/member/directory",
            icon: <Users />,
            description: "Browse community members directory.",
        },
    ];

    return (
        <MemberWrapper>
            <MemberHeader user={session.user} />

            {/* Incomplete Profile Notification */}
            <IncompleteProfileNotification />

            {/* Latest Breaking News Pill */}
            <Announcements audience="MEMBER" />

            {/* Member Updates List */}
            <div className="mt-8">
                 <AnnouncementViewer audience="MEMBER" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {resources.map((resource, idx) => (
                    <Link
                        key={idx}
                        href={resource.link}
                        className="group block p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                {React.cloneElement(resource.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6 text-zinc-300 group-hover:text-white" })}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-0">{resource.title}</h3>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {resource.description}
                        </p>
                    </Link>
                ))}
            </div>
        </MemberWrapper>
    );
}
