'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from '@/components/guides/GuideList';

export default function EventGuidesPage() {
    const [guides, setGuides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const res = await fetch('/api/guides?type=EVENT');
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
        fetchGuides();
    }, []);

    return (
        <CoreWrapper>
            <CorePageHeader 
                title="Event Guidelines" 
                description="Standard operating procedures and templates for organizing events."
                icon={<BookOpen className="w-5 h-5 text-zinc-200" />}
            >
                 <Link href="/core/events/guides/new">
                    <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                        <Plus className="w-4 h-4" /> Create Guide
                    </button>
                 </Link>
            </CorePageHeader>

            <GuideList 
                guides={guides} 
                basePath="/core/events/guides" 
                isLoading={isLoading} 
            />
        </CoreWrapper>
    );
}
