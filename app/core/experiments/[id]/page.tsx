"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle, Clock, Loader2, MessageSquare, Send, User, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { CoreWrapper } from "@/components/core/CoreWrapper";

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

export default function ExperimentDetailPage() {
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

  const handleStatusChange = async (newStage: string) => {
    if (!confirm(`Are you sure you want to move this to ${newStage}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/experiments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchExperiment();
      router.refresh();
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
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
      <CoreWrapper>
        <div className="flex items-center justify-center h-[50vh] text-black dark:text-white">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-500"/>
        </div>
      </CoreWrapper>
  );

  if (!experiment) return (
      <CoreWrapper>
          <div className="flex items-center justify-center h-[50vh] text-black dark:text-white">Not Found</div>
      </CoreWrapper>
  );

  const stageColors = {
    PROPOSED: "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-700",
    DISCUSSION: "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-zinc-200 dark:border-zinc-700",
    APPROVED: "bg-white text-black dark:bg-white dark:text-black border-white",
    REJECTED: "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 line-through",
  };

  return (
    <CoreWrapper>
        <div className="max-w-6xl mx-auto pb-20">
            <Link href="/core/experiments" className="inline-flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4"/>
                Back to Lab
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Experiment Card */}
                    <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-2xl overflow-hidden relative group shadow-2xl">
                         {/* Removed gradient top line */}
                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider shadow-lg shadow-black/20 dark:shadow-black/50 ${stageColors[experiment.stage]}`}>
                                    {experiment.stage}
                                </span>
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-full bg-white/40 dark:bg-black/40">
                                    <Calendar className="w-3.5 h-3.5"/>
                                    {new Date(experiment.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8 leading-tight text-black dark:text-white">{experiment.title}</h1>
                            
                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-black/5 dark:border-white/5">
                                {experiment.createdBy?.image ? (
                                    <Image src={experiment.createdBy.image} alt={experiment.createdBy.name} width={48} height={48} className="w-12 h-12 rounded-full ring-2 ring-black/10 dark:ring-white/10" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 ring-2 ring-black/10 dark:ring-white/10">
                                        <User className="w-6 h-6"/>
                                    </div>
                                )}
                                <div>
                                    <div className="text-base font-bold text-black dark:text-white">{experiment.createdBy?.name}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest">{experiment.createdBy?.email}</div>
                                </div>
                            </div>

                            <div className="prose dark:prose-invert prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-headings:text-black dark:prose-headings:text-white max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed">{experiment.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Discussion */}
                    <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-6 md:p-8 relative shadow-2xl">
                         {/* Connection Line */}
                         <div className="absolute -top-6 left-12 w-0.5 h-6 bg-gradient-to-b from-black/10 dark:from-white/10 to-black/[0.08] dark:to-white/[0.08]" />

                        <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
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
                                    {/* Avaatara */}
                                    <div className="absolute left-0 top-0">
                                         {comment.author?.image ? (
                                            <Image src={comment.author.image} alt="User" width={40} height={40} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#121212] relative z-10" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-[#121212] flex items-center justify-center text-xs relative z-10">
                                                {comment.author?.name?.[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{comment.author?.name}</span>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">{new Date(comment.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{comment.body}</p>
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
                                        className="relative block w-full bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-4 pr-14 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[120px] resize-none"
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

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-6 sticky top-28 shadow-2xl shadow-black/20 dark:shadow-black/50">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 pb-4 border-b border-black/5 dark:border-white/5">Governance Actions</h3>
                        
                        <div className="space-y-3">
                            {/* Move to Discussion: Superadmin Only from Proposed */}
                            {experiment.stage === 'PROPOSED' && isSuperAdmin && (
                                 <button
                                    onClick={() => handleStatusChange("DISCUSSION")}
                                    disabled={actionLoading}
                                    className="w-full py-3.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <MessageSquare className="w-4 h-4"/>}
                                    Open for Discussion
                                </button>
                            )}

                            {/* Approve/Reject: Superadmin Only */}
                            {isSuperAdmin && experiment.stage !== 'APPROVED' && experiment.stage !== 'REJECTED' && (
                                <>
                                    <button 
                                        onClick={() => handleStatusChange("APPROVED")}
                                        disabled={actionLoading}
                                        className="w-full py-3.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                                        Approve Proposal
                                    </button>
                                    <button 
                                        onClick={() => handleStatusChange("REJECTED")}
                                        disabled={actionLoading}
                                        className="w-full py-3.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4"/>}
                                        Reject Proposal
                                    </button>
                                </>
                            )}

                            {/* Status Helpers */}
                            {experiment.stage === 'APPROVED' && (
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                                         <CheckCircle className="w-6 h-6"/>
                                    </div>
                                    <div className="text-emerald-400 font-bold mb-1">Ratified</div>
                                    <p className="text-xs text-emerald-500/60">This proposal has been approved and moved to implementation planning.</p>
                                </div>
                            )}
                             {experiment.stage === 'REJECTED' && (
                                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                                         <XCircle className="w-6 h-6"/>
                                    </div>
                                    <div className="text-red-400 font-bold mb-1">Declined</div>
                                    <p className="text-xs text-red-500/60">This proposal was not accepted by the governance committee.</p>
                                </div>
                            )}

                            {!isSuperAdmin && experiment.stage === 'PROPOSED' && (
                                <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl text-center">
                                    <Clock className="w-5 h-5 text-zinc-500 mx-auto mb-2"/>
                                    <p className="text-xs text-zinc-500 italic">
                                        Proposal is currently under review by Superadmin.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </CoreWrapper>
  );
}
