'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MotionIcon } from 'motion-icons-react';
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { GuideList } from '@/components/guides/GuideList';

export default function MemberProgramGuidesPage() {
    const [guides, setGuides] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const res = await fetch('/api/guides?type=PROGRAM');
                if (res.ok) {
                    const data = await res.json();
                    
                    if (Array.isArray(data)) {
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
                    } else {
                        console.error("API returned non-array data:", data);
                        setGuides([]);
                    }
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
            <Link href="/member" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <MotionIcon name="ArrowLeft" className="w-4 h-4" />
                Back to Dashboard
            </Link>
            
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <MotionIcon name="Briefcase" className="w-5 h-5 text-zinc-200" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Program Guidelines</h1>
                        <p className="text-sm text-zinc-400">Access member-only and public program guides and resources.</p>
                    </div>
                </div>
            </div>

            <GuideList
                guides={guides}
                basePath="/member/programs"
                isLoading={isLoading}
                canDelete={false}
                canWrite={false}
            />
        </MemberWrapper>
    );
}
