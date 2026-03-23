"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from "@/components/guides/GuideBuilder";
import { Layers, X } from "lucide-react";
import Link from "next/link";

export default function NewProgramGuidePage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (data: any) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/guides", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push("/core/programs");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CoreWrapper>
            <CorePageHeader 
                title="Create Program Guide" 
                description="Define a new framework for programs and initiatives."
                icon={<Layers className="w-5 h-5 text-zinc-200"/>}
            >
                <Link href="/core/programs">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors border border-white/5">
                        <X className="w-4 h-4"/> Close
                    </button>
                </Link>
            </CorePageHeader>
            <GuideBuilder 
                type="PROGRAM" 
                onSave={handleSave} 
                isSaving={isSaving} 
            />
        </CoreWrapper>
    );
}
