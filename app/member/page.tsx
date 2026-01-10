import React from "react";
import { 
    User, Users, BookOpen, Beaker, Film
} from "lucide-react";
import Link from "next/link";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { AnnouncementViewer } from "@/components/public/AnnouncementViewer";
import { Announcements } from "@/components/website/Announcements";
import { MemberHeader } from "@/components/member/MemberHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export default async function MemberPage() {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        redirect('/public'); // Protect the route
    }

    const resources = [

        { 
            title: "Community", 
            link: "/public", 
            icon: <Users />, 
            description: "Connect with other members and partners.",
        },
        { 
            title: "Resources", 
            link: "/public", 
            icon: <BookOpen />, 
            description: "Access guides, playbooks, and learning materials.",
        },
        { 
            title: "Experiments", 
            link: "/core/experiments", 
            icon: <Beaker />, 
            description: "View and propose new community experiments.",
        },
        { 
            title: "Media Kit", 
            link: "/core/mediakit", 
            icon: <Film />, 
            description: "Download official brand assets and resources.",
        },
    ];

    return (
        <CoreWrapper>
            <MemberHeader user={session.user} />

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
        </CoreWrapper>
    );
}
