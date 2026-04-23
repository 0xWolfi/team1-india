"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Trophy } from "lucide-react";

export default function NewChallengePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", prizePool: "", maxTeamSize: 4, allowSolo: true });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { const data = await res.json(); router.push(`/core/challenges/${data.challenge.id}`); }
    setLoading(false);
  };

  return (
    <CoreWrapper>
      <CorePageHeader title="New Challenge" icon={<Trophy />} backLink="/core/challenges" backText="Back to Challenges" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div><label className="block text-sm font-medium mb-2">Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" /></div>
        <div><label className="block text-sm font-medium mb-2">Description</label><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-2">Prize Pool</label><input value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} placeholder="e.g. ₹50,000" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
          <div><label className="block text-sm font-medium mb-2">Max Team Size</label><input type="number" value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: parseInt(e.target.value) || 4 })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
        </div>
        <button type="submit" disabled={loading} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50">{loading ? "Creating..." : "Create Challenge"}</button>
      </form>
    </CoreWrapper>
  );
}
