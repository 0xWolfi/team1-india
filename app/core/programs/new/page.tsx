"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "CORE",
    coverImage: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           title: formData.title,
           description: formData.description,
           visibility: formData.visibility,
           customFields: {
               coverImage: formData.coverImage
           }
        }),
      });

      if (res.ok) {
        router.push("/core/programs");
        router.refresh(); // Refresh server components
      } else {
        alert("Failed to create program");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoreWrapper>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
            <Link href="/core/programs" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-4 transition-colors w-fit text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Programs
            </Link>
            <h1 className="text-3xl font-bold text-white">Create Program</h1>
            <p className="text-zinc-400 mt-2">Launch a new initiative.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 border border-white/10 p-8 rounded-2xl">
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Program Title</label>
                    <input 
                        type="text" 
                        required
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="e.g. AI Fellowship"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
                    <textarea 
                        required
                        rows={4}
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                        placeholder="Short summary of the program..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Visibility</label>
                        <select 
                            value={formData.visibility}
                            onChange={e => setFormData({...formData, visibility: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                        >
                            <option value="CORE">Hidden (Core Only)</option>
                            <option value="MEMBER">Members Only</option>
                            <option value="PUBLIC">Public</option>
                        </select>
                        <p className="text-xs text-zinc-600 mt-2">
                            Select <strong>Public</strong> to display on the public landing page.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cover Image URL</label>
                        <input 
                            type="url" 
                            value={formData.coverImage} 
                            onChange={e => setFormData({...formData, coverImage: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Create Program
                </button>
            </div>

        </form>
      </div>
    </CoreWrapper>
  );
}
