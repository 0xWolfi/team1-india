'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Newspaper } from "lucide-react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { GuideList } from '@/components/guides/GuideList';

export default function MemberContentGuidesPage() {
    const [guides, setGuides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const res = await fetch('/api/guides?type=CONTENT');
                if (res.ok) {
                    const data = await res.json();
                    // Filter to only show MEMBER and PUBLIC guides
                    const memberGuides = data.filter((g: any) =>
                        g.visibility === 'MEMBER' || g.visibility === 'PUBLIC'
                    );
                    // Sort: MEMBER first, then PUBLIC
                    memberGuides.sort((a: any, b: any) => {
                        if (a.visibility === 'MEMBER' && b.visibility !== 'MEMBER') return -1;
                        if (a.visibility !== 'MEMBER' && b.visibility === 'MEMBER') return 1;
                        return 0;
                    });
                    setGuides(memberGuides);
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
        <MemberWrapper>
            <Link href="/member" className="inline-flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4"/>
                Back to Dashboard
            </Link>
            
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                        <Newspaper className="w-5 h-5 text-zinc-700 dark:text-zinc-200"/>
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">Content Guidelines</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Access member-only and public content guides and best practices.</p>
                    </div>
                </div>
            </div>

            <GuideList
                guides={guides}
                basePath="/member/content"
                isLoading={isLoading}
                canDelete={false}
                canWrite={false}
            />
        </MemberWrapper>
    );
}
