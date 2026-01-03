'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from '@/components/guides/GuideBuilder';
import { PenTool } from 'lucide-react';

export default function NewContentGuidePage() {
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
                router.push('/core/content/guides');
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
                title="Create Content Guide" 
                description="Define a new content standard or resource type."
                icon={<PenTool className="w-5 h-5 text-zinc-200" />}
            />
            <GuideBuilder 
                type="CONTENT" 
                onSave={handleSave} 
                isSaving={isSaving} 
            />
        </CoreWrapper>
    );
}
