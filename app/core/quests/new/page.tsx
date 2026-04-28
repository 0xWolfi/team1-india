"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Zap } from "lucide-react";

export default function NewQuestPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", type: "one-time", category: "community", xpReward: 10, pointsReward: 10, audience: "all", proofRequired: true, proofDescription: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/quests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) router.push("/core/quests");
    setLoading(false);
  };

  return (
    <CoreWrapper>
      <CorePageHeader title="New Quest" icon={<Zap />} backLink="/core/quests" backText="Back to Quests" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div><label className="block text-sm font-medium mb-2">Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" /></div>
        <div><label className="block text-sm font-medium mb-2">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent resize-none focus:outline-none" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-2">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none"><option value="one-time">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="recurring">Recurring</option></select></div>
          <div><label className="block text-sm font-medium mb-2">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none"><option value="community">Community</option><option value="social">Social</option><option value="developer">Developer</option><option value="content">Content</option></select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium mb-2">XP Reward</label><input type="number" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
          <div><label className="block text-sm font-medium mb-2">Points Reward</label><input type="number" value={form.pointsReward} onChange={(e) => setForm({ ...form, pointsReward: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
          <div><label className="block text-sm font-medium mb-2">Audience</label><select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none"><option value="all">All</option><option value="member">Members</option><option value="public">Public</option></select></div>
        </div>
        <div><label className="block text-sm font-medium mb-2">Proof Description</label><input value={form.proofDescription} onChange={(e) => setForm({ ...form, proofDescription: e.target.value })} placeholder="e.g. Submit a screenshot of your tweet" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
        <button type="submit" disabled={loading} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50">{loading ? "Creating..." : "Create Quest"}</button>
      </form>
    </CoreWrapper>
  );
}
