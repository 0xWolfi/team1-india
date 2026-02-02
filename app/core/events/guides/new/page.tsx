'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from '@/components/guides/GuideBuilder';
import { MotionIcon } from "motion-icons-react";
import Link from 'next/link';

export default function NewEventGuidePage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (data: any) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/guides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push('/core/events');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CoreWrapper>
            <CorePageHeader 
                title="Create Event Guide" 
                description="Define a standard operating procedure for events."
                icon={<MotionIcon name="Calendar" className="w-5 h-5 text-zinc-200" />}
            >
                <Link href="/core/events">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors border border-white/5">
                        <MotionIcon name="X" className="w-4 h-4" /> Close
                    </button>
                </Link>
            </CorePageHeader>
            <GuideBuilder 
                type="EVENT" 
                onSave={handleSave} 
                isSaving={isSaving} 
            />
        </CoreWrapper>
    );
}
