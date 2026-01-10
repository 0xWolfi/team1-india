"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Layers, Save, ArrowLeft, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewProgramPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<"CORE" | "MEMBER" | "PUBLIC">("CORE");
    const [coverImage, setCoverImage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;
        setIsSaving(true);

        try {
            const res = await fetch("/api/programs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    visibility,
                    customFields: {
                        coverImage
                    }
                }),
            });

            if (res.ok) {
                router.push("/core/programs");
                router.refresh(); 
            } else {
                alert("Failed to create program");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const data = await res.json();
                setCoverImage(data.url);
            }
        } catch(e) { console.error(e); }
        finally { setIsUploading(false); }
    };

    return (
        <CoreWrapper>
            <CorePageHeader 
                title="Create Program" 
                description="Launch a new initiative or recurring series."
                icon={<Layers className="w-5 h-5 text-zinc-200" />}
            >
                <Link href="/core/programs">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors border border-white/5">
                        <X className="w-4 h-4" /> Close
                    </button>
                </Link>
            </CorePageHeader>

            <div className="max-w-2xl mx-auto space-y-8 pb-20">
                <form onSubmit={handleSave} className="space-y-8">
                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase">Cover Image</label>
                        <div className="relative group w-full h-48 bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-white/20 transition-all">
                            {coverImage ? (
                                <>
                                    <Image src={coverImage} alt="Cover" fill className="object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => setCoverImage("")}
                                        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/50 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-2">
                                    <ImageIcon className="w-6 h-6 text-zinc-600 group-hover:text-zinc-400" />
                                    <span className="text-xs text-zinc-600 group-hover:text-zinc-400 font-medium">
                                        {isUploading ? "Uploading..." : "Upload Image"}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Program Title</label>
                            <input 
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none"
                                placeholder="e.g. AI Fellowship"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                            <textarea 
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none h-32 resize-none"
                                placeholder="Short summary of the program..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Visibility</label>
                            <div className="flex gap-2">
                                {(["CORE", "MEMBER", "PUBLIC"] as const).map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setVisibility(v)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                            visibility === v 
                                            ? "bg-indigo-500 text-white border-indigo-500" 
                                            : "bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800"
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">
                                Select <strong>Public</strong> to display on the public landing page.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-white/5">
                        <button 
                            type="submit" 
                            disabled={isSaving || !title}
                            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Create Program</>}
                        </button>
                    </div>
                </form>
            </div>
        </CoreWrapper>
    );
}
