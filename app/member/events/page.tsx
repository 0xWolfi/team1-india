'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
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
        <CoreWrapper>
            <CorePageHeader
                title="Event Guidelines"
                description="Access member-only and public event guides and templates."
                icon={<Calendar className="w-5 h-5 text-zinc-200" />}
            />

            <GuideList
                guides={guides}
                basePath="/member/events"
                isLoading={isLoading}
                canDelete={false}
                canWrite={false}
            />
        </CoreWrapper>
    );
}
