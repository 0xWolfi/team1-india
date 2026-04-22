"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Save } from "lucide-react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

export default function NewExperimentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");
      
      router.push("/core/experiments");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoreWrapper>
        <CorePageHeader
            title="New Proposal"
            description="Draft a new experiment for community consideration."
            icon={<FileText className="w-5 h-5 text-zinc-700 dark:text-zinc-200"/>}
            backLink="/core/experiments"
        />

        <div className="max-w-3xl mx-auto">
            <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Proposal Title</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-bold"
                            placeholder="E.g., Adopt New Design System"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Detailed Description</label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-10 transition-opacity blur" />
                            <textarea
                                required
                                rows={8}
                                className="relative w-full bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none text-sm leading-relaxed"
                                placeholder="Describe your proposal in detail. Include goals, implementation steps, and success metrics..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-3 flex items-center gap-2">
                             <FileText className="w-3 h-3"/>
                             Markdown formatting is supported.
                        </p>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-bold transition-all shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10 hover:scale-105"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                            Submit Proposal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </CoreWrapper>
  );
}
