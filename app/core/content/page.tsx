'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from '@/components/guides/GuideList';
import { usePermission } from "@/hooks/usePermission";

export default function ContentPage() {
    const [guides, setGuides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const canCreate = usePermission("content", "WRITE");

    const fetchGuides = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/guides?type=CONTENT');
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
                title="Content"
                description="Manage content guidelines, templates, and publishing workflows."
                icon={<BookOpen className="w-5 h-5 text-zinc-200" />}
             >
                {canCreate && (
                    <Link href="/core/content/guides/new">
                        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                            <Plus className="w-4 h-4" /> Create Guide
                        </button>
                    </Link>
                )}
             </CorePageHeader>

            <GuideList 
                guides={guides} 
                basePath="/core/content/guides" 
                isLoading={isLoading} 
                canWrite={canCreate}
            />
        </CoreWrapper>
    );
}
