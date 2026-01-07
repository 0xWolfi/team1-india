'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Layers } from 'lucide-react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ProgramList } from '@/components/core/ProgramList';

export default function ProgramsPage() {
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPrograms = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/programs');
            if (res.ok) {
                const data = await res.json();
                setPrograms(data);
            }
        } catch (error) {
            console.error("Failed to fetch programs", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Programs"
                description="Manage long-running initiatives, visibility, and applications."
                icon={<Layers className="w-5 h-5 text-zinc-200" />}
            >
                <div className="flex items-center gap-2">
                    <Link href="/core/programs/new">
                        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                            <Plus className="w-4 h-4" /> Create Program
                        </button>
                    </Link>
                </div>
            </CorePageHeader>

            <ProgramList 
                programs={programs} 
                basePath="/core/programs" 
                isLoading={isLoading} 
            />
        </CoreWrapper>
    );
}
