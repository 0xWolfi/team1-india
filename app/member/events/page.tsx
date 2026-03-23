'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar } from "lucide-react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { GuideList } from '@/components/guides/GuideList';

export default function MemberEventGuidesPage() {
    const [guides, setGuides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const res = await fetch('/api/guides?type=EVENT');
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
            <Link href="/member" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4"/>
                Back to Dashboard
            </Link>
            
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <Calendar className="w-5 h-5 text-zinc-200"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Event Guidelines</h1>
                        <p className="text-sm text-zinc-400">Access member-only and public event guides and templates.</p>
                    </div>
                </div>
            </div>

            <GuideList
                guides={guides}
                basePath="/member/events"
                isLoading={isLoading}
                canDelete={false}
                canWrite={false}
            />
        </MemberWrapper>
    );
}
