"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2, MessageSquare, Send, User, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { MemberWrapper } from "@/components/member/MemberWrapper";

interface Experiment {
  id: string;
  title: string;
  description: string;
  stage: "PROPOSED" | "DISCUSSION" | "APPROVED" | "REJECTED";
  createdAt: string;
  createdBy: {
    name: string;
    image: string;
    email: string;
  };
  comments: Comment[];
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    name: string;
    image: string;
  };
}

export default function MemberExperimentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userPermissions = (session?.user as any)?.permissions || {};
  const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

  useEffect(() => {
    fetchExperiment();
  }, [id]);

  const fetchExperiment = async () => {
    try {
      const res = await fetch(`/api/experiments/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setExperiment(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/experiments/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentBody("");
      fetchExperiment();
    } catch (error) {
      alert("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return (
      <MemberWrapper>
        <div className="flex items-center justify-center h-[50vh] text-black dark:text-white">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-500"/>
        </div>
      </MemberWrapper>
  );

  if (!experiment) return (
      <MemberWrapper>
          <div className="flex items-center justify-center h-[50vh] text-black dark:text-white">Not Found</div>
      </MemberWrapper>
  );

  const stageColors = {
    PROPOSED: "text-zinc-500",
    DISCUSSION: "text-indigo-400",
    APPROVED: "text-emerald-400",
    REJECTED: "text-red-400 line-through",
  };

  return (
    <MemberWrapper>
        <div className="max-w-6xl mx-auto pb-20">
            <Link href="/member/experiments" className="inline-flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4"/>
                Back to Proposals
            </Link>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Experiment Card */}
                <div className="bg-zinc-100/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden relative group shadow-2xl">
                    <div className="p-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-8 leading-tight text-black dark:text-white">{experiment.title}</h1>

                        <div className="flex items-start justify-between gap-4 mb-8 pb-8 border-b border-black/10 dark:border-white/10">
                            <div className="flex items-center gap-4">
                                {experiment.createdBy?.image ? (
                                    <Image src={experiment.createdBy.image} alt={experiment.createdBy.name} width={48} height={48} className="w-12 h-12 rounded-full ring-2 ring-black/10 dark:ring-white/10" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 ring-2 ring-black/10 dark:ring-white/10">
                                        <User className="w-6 h-6"/>
                                    </div>
                                )}
                                <div>
                                    <div className="text-base font-bold text-black dark:text-white">{experiment.createdBy?.name}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{experiment.createdBy?.email}</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-0.5 opacity-90">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${stageColors[experiment.stage].split(' ')[1].replace('text-', 'bg-')}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${stageColors[experiment.stage]}`}>
                                        {experiment.stage}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                        {new Date(experiment.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium lowercase">proposed on</div>
                                </div>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert prose-p:text-zinc-700 dark:prose-p:text-zinc-200 prose-headings:text-black dark:prose-headings:text-white max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed">{experiment.description}</p>
                        </div>
                    </div>
                </div>

                {/* Governance Actions (SuperAdmin Only) */}
                {isSuperAdmin && (
                    <div className="bg-zinc-100/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Governance Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            {/* Move to Discussion */}
                            {experiment.stage === 'PROPOSED' && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to move this to DISCUSSION?')) return;
                                        setActionLoading(true);
                                        try {
                                            const res = await fetch(`/api/experiments/${id}`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ stage: "DISCUSSION" }),
                                            });
                                            if (!res.ok) throw new Error("Failed to update");
                                            await fetchExperiment();
                                        } catch (error) {
                                            alert("Failed to update status");
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <MessageSquare className="w-3 h-3"/>}
                                    Open for Discussion
                                </button>
                            )}

                            {/* Approve/Reject */}
                            {experiment.stage !== 'APPROVED' && experiment.stage !== 'REJECTED' && (
                                <>
                                    <button 
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to APPROVE this proposal?')) return;
                                            setActionLoading(true);
                                            try {
                                                const res = await fetch(`/api/experiments/${id}`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ stage: "APPROVED" }),
                                                });
                                                if (!res.ok) throw new Error("Failed to update");
                                                await fetchExperiment();
                                            } catch (error) {
                                                alert("Failed to update status");
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>}
                                        Approve
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to REJECT this proposal?')) return;
                                            setActionLoading(true);
                                            try {
                                                const res = await fetch(`/api/experiments/${id}`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ stage: "REJECTED" }),
                                                });
                                                if (!res.ok) throw new Error("Failed to update");
                                                await fetchExperiment();
                                            } catch (error) {
                                                alert("Failed to update status");
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <XCircle className="w-3 h-3"/>}
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Discussion */}
                <div className="bg-zinc-100/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl p-8 relative shadow-2xl">
                     {/* Connection Line */}
                     <div className="absolute -top-6 left-12 w-0.5 h-6 bg-gradient-to-b from-black/10 dark:from-white/10 to-black/5 dark:to-white/5" />

                    <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-black dark:text-white">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <MessageSquare className="w-5 h-5"/>
                        </div>
                        Discussion Feed
                        <span className="text-zinc-500 text-sm font-normal">({experiment.comments.length})</span>
                    </h3>

                    <div className="space-y-8 mb-8 relative">
                        {/* Feed Line */}
                        {experiment.comments.length > 0 && (
                            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-black/5 dark:bg-white/5" />
                        )}

                        {experiment.comments.map((comment) => (
                            <div key={comment.id} className="relative pl-14 group">
                                {/* Avatar */}
                                <div className="absolute left-0 top-0">
                                     {comment.author?.image ? (
                                        <Image src={comment.author.image} alt="User" width={40} height={40} className="w-10 h-10 rounded-full border-2 border-zinc-100 dark:border-zinc-900 relative z-10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-900 flex items-center justify-center text-xs relative z-10">
                                            {comment.author?.name?.[0]}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-4 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{comment.author?.name}</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(comment.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                                </div>
                            </div>
                        ))}

                        {experiment.comments.length === 0 && (
                            <div className="text-center py-12 px-4 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
                                <p className="text-zinc-500 text-sm italic">
                                    No comments yet. Be the first to start the discussion.
                                </p>
                            </div>
                        )}
                    </div>

                    {experiment.stage === 'DISCUSSION' && (
                        <form onSubmit={handlePostComment} className="relative mt-8">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition-opacity blur" />
                                <textarea
                                    className="relative block w-full bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-4 pr-14 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-zinc-500 min-h-[120px] resize-none"
                                    placeholder="Share your thoughts..."
                                    value={commentBody}
                                    onChange={(e) => setCommentBody(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={submittingComment || !commentBody.trim()}
                                    className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-zinc-600 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {experiment.stage === 'PROPOSED' && (
                        <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                            <p className="text-sm text-amber-400">
                                Comments will be enabled once this proposal is moved to <strong>DISCUSSION</strong> stage.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </MemberWrapper>
  );
}
