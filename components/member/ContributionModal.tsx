"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link2, Loader2, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface ContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
}

type QuestType = "quest-fullstack" | "quest-creator" | "quest-builder" | "";

const QUESTS = [
    {
        value: "quest-fullstack" as const,
        label: "Full Stack Contributor Challenge",
        reward: "$50 + Swags (T-shirt/Cap)",
        winnerCap: "3/month",
        tasks: [
            "Attend a Team1 event",
            "Post 1 quality thread (Avalanche/Ecosystem) — 1000+ impressions, 40+ likes, 10+ comments & RT",
            "Post 1 video covering event or Avalanche content — same reach requirements",
            "Join TG chat and engage with community",
            "Post 3 quality tweets supporting Avalanche — 600-1000+ impressions, 20-30+ likes, 5-7 comments & RT",
        ],
        linkLabels: [
            "Thread Link (X post)",
            "Video Link (YouTube/X)",
            "Tweet 1 Link",
            "Tweet 2 Link",
            "Tweet 3 Link",
            "TG Username",
            "Event Attended (Name & Date)",
        ],
    },
    {
        value: "quest-creator" as const,
        label: "30 Day Avalanche Creator Sprint",
        reward: "$50 + Swags (T-shirt/Cap)",
        winnerCap: "3/month",
        tasks: [
            "One X post/day for 30 days (Avalanche updates, ecosystem, personal learning journey)",
            "All content: 300-600+ impressions, 10-20+ likes, 3-5 comments & RT",
            "Tag @Team1IND and @AvaxTeam1",
        ],
        linkLabels: [
            "X Profile Link",
            "Best Post Link 1",
            "Best Post Link 2",
            "Best Post Link 3",
            "Any Additional Link",
        ],
    },
    {
        value: "quest-builder" as const,
        label: '"Build in Public" Challenge',
        reward: "$100 + Swags + Builder Spotlight on X",
        winnerCap: "2/month",
        tasks: [
            "Share what you're building on Avalanche",
            "Weekly progress threads + tweets × 4 weeks (1 thread + 1 tweet mandatory per week)",
            "600-1000+ impressions, 20-30+ likes, 5-7 comments & RT",
            "Tag @Team1IND and @AvaxTeam1 + use #Team1BuildInPublic",
        ],
        linkLabels: [
            "Project/Repo Link",
            "Week 1 Thread",
            "Week 2 Thread",
            "Week 3 Thread",
            "Week 4 Thread",
            "Any Additional Link",
        ],
    },
];

export const ContributionModal: React.FC<ContributionModalProps> = ({
    isOpen,
    onClose,
    user,
}) => {
    const { data: session } = useSession();
    const [questType, setQuestType] = useState<QuestType>("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const selectedQuest = QUESTS.find(q => q.value === questType);

    useEffect(() => {
        if (isOpen && session) {
            setName(user?.name || session.user?.name || "");
            setEmail(user?.email || session.user?.email || "");
        }
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen, session, user]);

    useEffect(() => {
        if (selectedQuest) {
            setLinks(selectedQuest.linkLabels.map(label => ({ label, url: "" })));
        } else {
            setLinks([]);
        }
    }, [questType, selectedQuest]);

    // Scroll to links when quest is selected
    useEffect(() => {
        if (selectedQuest && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [selectedQuest]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questType) { alert("Please select a quest"); return; }
        const filledLinks = links.filter(l => l.url.trim() !== "");
        if (filledLinks.length === 0) { alert("Please add at least one link"); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/contributions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: questType, name, email, links: filledLinks }),
            });
            if (res.ok) {
                alert("Quest submission sent successfully!");
                setQuestType("");
                setLinks([]);
                onClose();
            } else {
                const error = await res.text();
                alert(`Error: ${error}`);
            }
        } catch {
            alert("Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            {/* Modal — pinned top/bottom with margin, body scrolls */}
            <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl flex flex-col bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
                {/* Header — fixed at top */}
                <div className="p-5 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white">Bounty Details</h3>
                        <button onClick={onClose} type="button" className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-red-400 font-semibold">Only for Team1 India Members — Do not Share</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Sprint 1 — April 1st to April 30th 2026</p>
                </div>

                {/* Scrollable content — this WILL scroll because parent has fixed height (top-4 bottom-4) */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
                    <form onSubmit={handleSubmit} className="p-5 space-y-5">
                        {/* Name & Email */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Name</label>
                                <input type="text" value={name} readOnly disabled className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Email</label>
                                <input type="email" value={email} readOnly disabled className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed" />
                            </div>
                        </div>

                        {/* Quest Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Select Quest</label>
                            <div className="space-y-2">
                                {QUESTS.map(quest => (
                                    <button
                                        key={quest.value}
                                        type="button"
                                        onClick={() => setQuestType(questType === quest.value ? "" : quest.value)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border transition-all",
                                            questType === quest.value
                                                ? "bg-red-500/10 border-red-500/30"
                                                : "bg-zinc-800/30 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-white">{quest.label}</span>
                                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                                {quest.reward}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500">Winner cap: {quest.winnerCap}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quest Details */}
                        {selectedQuest && (
                            <>
                                <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Tasks Required</h4>
                                    <ul className="space-y-2">
                                        {selectedQuest.tasks.map((task, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                                <span className="text-red-400 font-bold mt-0.5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                                                {task}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-[10px] text-zinc-600 mt-3">Requirement: tag @Team1IND and @AvaxTeam1</p>
                                </div>

                                {/* Link Fields */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">Submit Your Links</label>
                                    <div className="space-y-3">
                                        {links.map((link, i) => (
                                            <div key={i}>
                                                <label className="block text-[11px] text-zinc-400 mb-1">{link.label}</label>
                                                <div className="relative">
                                                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                                                    <input
                                                        type="text"
                                                        value={link.url}
                                                        onChange={e => {
                                                            const updated = [...links];
                                                            updated[i].url = e.target.value;
                                                            setLinks(updated);
                                                        }}
                                                        placeholder={link.label.includes("Link") ? "https://..." : "Enter details..."}
                                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !questType}
                                className="px-5 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Submit Quest</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
