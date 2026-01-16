"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Send, Calendar, FileText } from "lucide-react";
import { useSession } from "next-auth/react";

interface ContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
}

type ContributionType = "event-host" | "content" | "";

export const ContributionModal: React.FC<ContributionModalProps> = ({ 
    isOpen, 
    onClose, 
    user 
}) => {
    const { data: session } = useSession();
    const [contributionType, setContributionType] = useState<ContributionType>("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Event Host fields
    const [eventDate, setEventDate] = useState("");
    const [eventLocation, setEventLocation] = useState("");

    // Content fields
    const [contentUrl, setContentUrl] = useState("");

    useEffect(() => {
        if (isOpen && session) {
            // Pre-fill name and email from session/user (read-only)
            setName(user?.name || session.user?.name || "");
            setEmail(user?.email || session.user?.email || "");
        }
    }, [isOpen, session, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!contributionType) {
            alert("Please select a contribution type");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: any = {
                type: contributionType,
                name,
                email,
            };

            // Add type-specific fields
            if (contributionType === "event-host") {
                if (!eventDate || !eventLocation) {
                    alert("Please fill in all Event Host fields");
                    setIsSubmitting(false);
                    return;
                }
                payload.eventDate = eventDate;
                payload.eventLocation = eventLocation;
            } else if (contributionType === "content") {
                if (!contentUrl) {
                    alert("Please enter content URL");
                    setIsSubmitting(false);
                    return;
                }
                payload.contentUrl = contentUrl;
            }

            const res = await fetch("/api/contributions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert("Contribution submitted successfully!");
                // Reset form
                setContributionType("");
                setEventDate("");
                setEventLocation("");
                setContentUrl("");
                onClose();
            } else {
                const error = await res.text();
                alert(`Error: ${error}`);
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit contribution. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" 
            onClick={onClose}
        >
            <div 
                className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Submit Your Contributions</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Name Field - Read Only */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">
                            Name <span className="text-zinc-500 text-xs">(from your profile)</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            readOnly
                            disabled
                            className="w-full bg-zinc-900/30 border border-white/5 rounded-lg px-4 py-2.5 text-zinc-400 cursor-not-allowed"
                            placeholder="Your name"
                        />
                    </div>

                    {/* Email Field - Read Only */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">
                            Email <span className="text-zinc-500 text-xs">(from your profile)</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            readOnly
                            disabled
                            className="w-full bg-zinc-900/30 border border-white/5 rounded-lg px-4 py-2.5 text-zinc-400 cursor-not-allowed"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    {/* Contribution Type Dropdown */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-zinc-300 mb-2">
                            Contribution Type
                        </label>
                        <select
                            value={contributionType}
                            onChange={(e) => setContributionType(e.target.value as ContributionType)}
                            required
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50"
                        >
                            <option value="" className="bg-zinc-900">Select contribution type</option>
                            <option value="event-host" className="bg-zinc-900">Event Host</option>
                            <option value="content" className="bg-zinc-900">Content</option>
                        </select>
                    </div>

                    {/* Event Host Fields */}
                    {contributionType === "event-host" && (
                        <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-emerald-400" />
                                <label className="text-sm font-semibold text-emerald-300">
                                    Event Host Details
                                </label>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        required
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        City or College
                                    </label>
                                    <input
                                        type="text"
                                        value={eventLocation}
                                        onChange={(e) => setEventLocation(e.target.value)}
                                        required
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                                        placeholder="e.g., Mumbai, India or MIT College"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Fields */}
                    {contributionType === "content" && (
                        <div className="mb-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-purple-400" />
                                <label className="text-sm font-semibold text-purple-300">
                                    Content Details
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    URL (where you have submitted the content)
                                </label>
                                <input
                                    type="url"
                                    value={contentUrl}
                                    onChange={(e) => setContentUrl(e.target.value)}
                                    required
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50"
                                    placeholder="https://example.com/article or draft link"
                                />
                            </div>
                        </div>
                    )}


                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !contributionType}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Contribution
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
