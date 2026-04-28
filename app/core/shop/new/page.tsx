"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ShoppingBag } from "lucide-react";

export default function NewSwagItemPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", image: "", pointsCost: 100, totalStock: 10, audience: "all", category: "tshirt" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/swag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) router.push("/core/shop");
    setLoading(false);
  };

  return (
    <CoreWrapper>
      <CorePageHeader title="New Swag Item" icon={<ShoppingBag />} backLink="/core/shop" backText="Back to Shop" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div><label className="block text-sm font-medium mb-2">Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" /></div>
        <div><label className="block text-sm font-medium mb-2">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent resize-none focus:outline-none" /></div>
        <div><label className="block text-sm font-medium mb-2">Image URL</label><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-2">Points Cost</label><input type="number" required value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
          <div><label className="block text-sm font-medium mb-2">Total Stock</label><input type="number" value={form.totalStock} onChange={(e) => setForm({ ...form, totalStock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none" /></div>
        </div>
        <button type="submit" disabled={loading} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50">{loading ? "Creating..." : "Create Item"}</button>
      </form>
    </CoreWrapper>
  );
}
