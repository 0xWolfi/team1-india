'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Layers } from 'lucide-react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from '@/components/guides/GuideList';

export default function ProgramsPage() {
    const [guides, setGuides] = useState([]);
    const [isGuidesLoading, setIsGuidesLoading] = useState(true);

    const fetchGuides = async () => {
        setIsGuidesLoading(true);
        try {
            const res = await fetch('/api/guides?type=PROGRAM');
            if (res.ok) {
                const data = await res.json();
                setGuides(data);
            }
        } catch (error) {
            console.error("Failed to fetch guides", error);
        } finally {
            setIsGuidesLoading(false);
        }
    };

    useEffect(() => {
        fetchGuides();
    }, []);

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Program Guides"
                description="Manage long-running initiatives, mentorship circles, and recurring series."
                icon={<Layers className="w-5 h-5 text-zinc-200" />}
            >
                <div className="flex items-center gap-2">
                    <Link href="/core/programs/guides/new">
                        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                            <Plus className="w-4 h-4" /> Create Guide
                        </button>
                    </Link>
                </div>
            </CorePageHeader>

            <GuideList 
                guides={guides} 
                basePath="/core/programs/guides" 
                isLoading={isGuidesLoading} 
            />
        </CoreWrapper>
    );
}
