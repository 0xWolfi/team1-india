"use client";

import React, { useState, useEffect } from "react";
import { Link2, Loader2, Plus, Send, ArrowLeft, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SubmitQuestFormProps {
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
            "X Post Link",
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
            "X Post Link",
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
            "X Post Link",
        ],
    },
];

export const SubmitQuestForm: React.FC<SubmitQuestFormProps> = ({ user }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const [questType, setQuestType] = useState<QuestType>("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
    const [extraLinks, setExtraLinks] = useState<string[]>([]);

    const selectedQuest = QUESTS.find(q => q.value === questType);

    useEffect(() => {
        if (session) {
            setName(user?.name || session.user?.name || "");
            setEmail(user?.email || session.user?.email || "");
        }
    }, [session, user]);

    useEffect(() => {
        if (selectedQuest) {
            setLinks(selectedQuest.linkLabels.map(label => ({ label, url: "" })));
        } else {
            setLinks([]);
        }
        setExtraLinks([]);
    }, [questType, selectedQuest]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questType) { alert("Please select a quest"); return; }
        const filledLinks = links.filter(l => l.url.trim() !== "");
        if (filledLinks.length === 0) { alert("Please add at least one X post link"); return; }
        // Validate X post links
        for (const link of filledLinks) {
            if (!link.url.match(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//)) {
                alert(`"${link.label}" must be an x.com URL (e.g. https://x.com/...)`);
                return;
            }
        }
        const filledExtra = extraLinks.filter(u => u.trim() !== "").map((u, i) => ({ label: `Additional Link ${i + 1}`, url: u }));
        const allLinks = [...filledLinks, ...filledExtra];
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/contributions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: questType, name, email, links: allLinks }),
            });
            if (res.ok) {
                alert("Quest submission sent successfully!");
                setQuestType("");
                setLinks([]);
                setExtraLinks([]);
                router.push("/member");
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

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <button
                type="button"
                onClick={() => router.push("/member")}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Submit Quest</h1>
                <p className="text-xs text-red-400 font-semibold">Only for Team1 India Members — Do not Share</p>
                <p className="text-[11px] text-zinc-500 mt-1">Sprint 1 — April 1st to April 30th 2026</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Name</label>
                        <input type="text" value={name} readOnly disabled className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Email</label>
                        <input type="email" value={email} readOnly disabled className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-zinc-400 cursor-not-allowed" />
                    </div>
                </div>

                {/* Quest Selection */}
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-3">Select Quest</label>
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
                                        : "bg-zinc-900/40 border-white/5 hover:border-white/10"
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

                {/* Tasks + Links — shown when a quest is selected */}
                {selectedQuest && (
                    <>
                        {/* Tasks Required */}
                        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5">
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

                        {/* X Post Link Fields */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Submit Your X Post Links</label>
                            <p className="text-[10px] text-zinc-600 mb-3">Only x.com URLs accepted (e.g. https://x.com/user/status/...)</p>
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
                                                placeholder="https://x.com/..."
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Links (unrestricted) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-zinc-500 uppercase">Additional Links</label>
                                <button
                                    type="button"
                                    onClick={() => setExtraLinks(prev => [...prev, ""])}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Link
                                </button>
                            </div>
                            {extraLinks.length === 0 && (
                                <p className="text-[10px] text-zinc-600">Click + to add any additional links (YouTube, GitHub, etc.)</p>
                            )}
                            <div className="space-y-3">
                                {extraLinks.map((url, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={e => {
                                                    const updated = [...extraLinks];
                                                    updated[i] = e.target.value;
                                                    setExtraLinks(updated);
                                                }}
                                                placeholder="https://..."
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setExtraLinks(prev => prev.filter((_, j) => j !== i))}
                                            className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => router.push("/member")}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !questType}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    );
};
