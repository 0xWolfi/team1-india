"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Beaker, Calendar, CheckCircle, Clock, FileText, Loader2, MapPin, MessageCircle, MessageSquare, Send, Twitter, User, Wallet, XCircle } from "lucide-react";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { type CommunityMember } from "../components/ViewMemberModal";

interface Application {
    id: string;
    applicantEmail: string;
    status: string | null;
    submittedAt: Date;
    guide: {
        id: string;
        title: string | null;
        type: string | null;
        coverImage: string | null;
    } | null;
}

interface Experiment {
    id: string;
    title: string | null;
    description: string | null;
    stage: string | null;
    upvotes: number;
    createdAt: Date;
}

interface ExperimentComment {
    id: string;
    body: string | null;
    createdAt: Date;
    experiment: {
        id: string;
        title: string | null;
    };
}

interface ActivityData {
    applications: Application[];
    experiments: Experiment[];
    experimentComments: ExperimentComment[];
    stats: {
        totalApplications: number;
        pendingApplications: number;
        approvedApplications: number;
        rejectedApplications: number;
        totalExperiments: number;
        totalComments: number;
    };
}

export default function MemberDetailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const memberId = params?.id as string;

    const [member, setMember] = useState<CommunityMember | null>(null);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Check if user is superadmin
    // @ts-ignore
    const userPermissions = (session?.user as any)?.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    useEffect(() => {
        if (!session) return;
        
        if (!isSuperAdmin) {
            setIsAuthorized(false);
            setIsLoading(false);
            return;
        }

        setIsAuthorized(true);
        
        // Fetch member details
        fetch(`/api/community-members/${memberId}`)
            .then(res => res.json())
            .then(data => {
                setMember(data);
            })
            .catch(err => {
                console.error("Failed to fetch member:", err);
            });

        // Fetch activity
        fetch(`/api/community-members/${memberId}/activity`)
            .then(res => res.json())
            .then(data => {
                setActivity(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch activity:", err);
                setIsLoading(false);
            });
    }, [session, memberId, isSuperAdmin]);

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                Loading...
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="md:pt-4">
                <CorePageHeader
                    title="Access Denied"
                    description="Only Superadmins can view member details"
                    icon={<User className="w-5 h-5 text-red-400"/>}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="md:pt-4">
                <CorePageHeader
                    title="Member Details"
                    description="Loading member information..."
                    icon={<User className="w-5 h-5 text-emerald-400"/>}
                />
                <div className="flex items-center justify-center h-64 text-zinc-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin"/>
                    Loading...
                </div>
            </div>
        );
    }

    const getInitials = (name: string | null | undefined, email: string) => {
        if (name) return name.charAt(0).toUpperCase();
        return email.charAt(0).toUpperCase();
    };

    const getStatusBadge = (status: string | null) => {
        if (!status) return null;
        const statusLower = status.toLowerCase();
        if (statusLower === 'approved' || statusLower === 'accepted') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3 mr-1"/>
                    {status}
                </span>
            );
        }
        if (statusLower === 'rejected' || statusLower === 'declined') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1"/>
                    {status}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-3 h-3 mr-1"/>
                {status}
            </span>
        );
    };

    const customFields = member?.customFields || {};
    const wallet = customFields.wallet || '';
    const address = customFields.address || '';
    const discord = customFields.discord || '';
    const bio = customFields.bio || '';

    return (
        <div className="md:pt-4">
            <CorePageHeader
                title="Member Details"
                description={`Complete profile and activity tracking for ${member?.name || member?.email || 'Member'}`}
                icon={<User className="w-5 h-5 text-emerald-400"/>}
                backLink="/core/members"
            >
                <button 
                    onClick={() => router.push('/core')}
                    className="bg-white text-black dark:bg-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all shadow-lg shadow-black/5 dark:shadow-white/5 flex items-center gap-2 active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4"/> Back to Dashboard
                </button>
            </CorePageHeader>

            {/* Member Profile Section */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-2xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-zinc-200 dark:from-zinc-800 to-white dark:to-black border border-black/10 dark:border-white/10 flex items-center justify-center text-2xl sm:text-3xl font-bold text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                        {getInitials(member?.name, member?.email || '')}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white mb-2">
                            {member?.name || "Unknown"}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{member?.email}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/5 uppercase">
                                {member?.tags || 'member'}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                                member?.status === 'active' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 border border-black/5 dark:border-white/5'
                            }`}>
                                {member?.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member?.xHandle && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg">
                            <Twitter className="w-4 h-4 text-zinc-500 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-zinc-500 mb-1">X Handle</div>
                                <div className="text-sm text-black dark:text-white">@{member.xHandle.replace('@', '')}</div>
                            </div>
                        </div>
                    )}

                    {member?.telegram && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg">
                            <Send className="w-4 h-4 text-zinc-500 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-zinc-500 mb-1">Telegram</div>
                                <div className="text-sm text-black dark:text-white">@{member.telegram.replace('@', '')}</div>
                            </div>
                        </div>
                    )}

                    {discord && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg">
                            <MessageCircle className="w-4 h-4 text-zinc-500 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-zinc-500 mb-1">Discord</div>
                                <div className="text-sm text-black dark:text-white">{discord}</div>
                            </div>
                        </div>
                    )}

                    {wallet && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg">
                            <Wallet className="w-4 h-4 text-zinc-500 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-zinc-500 mb-1">Wallet</div>
                                <div className="text-sm text-black dark:text-white font-mono break-all">{wallet}</div>
                            </div>
                        </div>
                    )}

                    {address && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg md:col-span-2">
                            <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-zinc-500 mb-1">Address</div>
                                <div className="text-sm text-black dark:text-white">{address}</div>
                            </div>
                        </div>
                    )}

                    {bio && (
                        <div className="flex items-start gap-3 p-3 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg md:col-span-2">
                            <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-zinc-500 mb-1">Bio</div>
                                <div className="text-sm text-black dark:text-white whitespace-pre-wrap">{bio}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Stats */}
            {activity && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-4">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white mb-1">{activity.stats.totalApplications}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Applications</div>
                    </div>
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-4">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-400 mb-1">{activity.stats.approvedApplications}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Approved</div>
                    </div>
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-4">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-400 mb-1">{activity.stats.pendingApplications}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending</div>
                    </div>
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-4">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white mb-1">{activity.stats.totalExperiments}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Proposals</div>
                    </div>
                </div>
            )}

            {/* Applications Section */}
            {activity && activity.applications.length > 0 && (
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-2xl p-4 sm:p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-5 h-5 text-indigo-400"/>
                        <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">Applications</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/5">
                            {activity.applications.length}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {activity.applications.map((app) => (
                            <div 
                                key={app.id} 
                                className="p-4 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg hover:border-black/20 dark:hover:border-white/20 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-bold text-black dark:text-white">{app.guide?.title || 'Untitled'}</h4>
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                                                {app.guide?.type || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500 mb-2">
                                            Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                                        </div>
                                        {getStatusBadge(app.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Experiments Section */}
            {activity && activity.experiments.length > 0 && (
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Beaker className="w-5 h-5 text-purple-400"/>
                        <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">Proposals</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/5">
                            {activity.experiments.length}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {activity.experiments.map((exp) => (
                            <div 
                                key={exp.id} 
                                className="p-4 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg hover:border-black/20 dark:hover:border-white/20 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-black dark:text-white mb-2">{exp.title || 'Untitled Proposal'}</h4>
                                        {exp.description && (
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">{exp.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {getStatusBadge(exp.stage)}
                                            <span className="text-xs text-zinc-500">
                                                {exp.upvotes} upvotes
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(exp.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comments Section */}
            {activity && activity.experimentComments.length > 0 && (
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="w-5 h-5 text-blue-400"/>
                        <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">Comments</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/5">
                            {activity.experimentComments.length}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {activity.experimentComments.map((comment) => (
                            <div 
                                key={comment.id} 
                                className="p-4 bg-zinc-100/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 rounded-lg"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <div className="text-xs text-zinc-500 mb-2">
                                            On: <span className="text-black dark:text-white">{comment.experiment.title || 'Untitled Proposal'}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{comment.body}</p>
                                        <div className="text-xs text-zinc-500">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {activity && activity.applications.length === 0 && activity.experiments.length === 0 && activity.experimentComments.length === 0 && (
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-2xl p-12 text-center">
                    <div className="text-zinc-500 mb-2">No activity recorded yet</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">This member hasn't submitted any applications or proposals.</div>
                </div>
            )}
        </div>
    );
}
