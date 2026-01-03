'use client';

import React, { useState, useEffect } from 'react';
import { Plus, PenTool } from 'lucide-react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from '@/components/guides/GuideList';

export default function ContentPage() {
    const [guides, setGuides] = useState([]);
    const [isGuidesLoading, setIsGuidesLoading] = useState(true);

    const fetchGuides = async () => {
        setIsGuidesLoading(true);
        try {
            const res = await fetch('/api/guides?type=CONTENT');
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
                title="Content Guides"
                description="Manage your content inventory, guidelines, and resources."
                icon={<PenTool className="w-5 h-5 text-zinc-200" />}
             >
                <div className="flex items-center gap-2">
                    <Link href="/core/content/guides/new">
                        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                            <Plus className="w-4 h-4" /> Create Resource
                        </button>
                    </Link>
                </div>
             </CorePageHeader>

            <GuideList 
                guides={guides} 
                basePath="/core/content/guides" 
                isLoading={isGuidesLoading} 
            />
        </CoreWrapper>
    );
}
