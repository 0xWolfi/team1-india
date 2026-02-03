"use client";

import React, { useState, useEffect } from "react";
import { MotionIcon } from "motion-icons-react";
import Link from "next/link";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from "@/components/guides/GuideList";
import { usePermission } from "@/hooks/usePermission";

export default function ProgramsPage() {
    const [guides, setGuides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const canCreate = usePermission("program", "WRITE");

    const fetchGuides = async () => {
        setIsLoading(true);
        try {
// ... existing code ...
            const res = await fetch("/api/guides?type=PROGRAM");
            if (res.ok) {
                const data = await res.json();
                setGuides(data);
            }
        } catch (error) {
            console.error("Failed to fetch guides", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGuides();
    }, []);

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Programs"
                description="Manage long-running initiatives, visibility, and applications."
                icon={<MotionIcon name="Layers" className="w-5 h-5 text-zinc-200" />}
            >
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <Link href="/core/programs/guides/new">
                            <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                                <MotionIcon name="Plus" className="w-4 h-4" /> Create Guide
                            </button>
                        </Link>
                    )}
                </div>
            </CorePageHeader>

            <GuideList 
                guides={guides} 
                basePath="/core/programs/guides" 
                isLoading={isLoading}
                canWrite={canCreate} 
            />
        </CoreWrapper>
    );
}
