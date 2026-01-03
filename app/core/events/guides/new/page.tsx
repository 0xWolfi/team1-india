'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from '@/components/guides/GuideBuilder';
import { BookOpen } from 'lucide-react';

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
                router.push('/core/events/guides');
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
                description="Define a new standard operating procedure for events."
                icon={<BookOpen className="w-5 h-5 text-zinc-200" />}
            />
            <GuideBuilder 
                type="EVENT" 
                onSave={handleSave} 
                isSaving={isSaving} 
            />
        </CoreWrapper>
    );
}
