'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideBuilder } from '@/components/guides/GuideBuilder';
import { Layers, Loader2 } from 'lucide-react';

export default function EditProgramGuidePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    
    const [guide, setGuide] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchGuide = async () => {
            try {
                const res = await fetch(`/api/guides/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGuide(data);
                }
            } catch (error) {
                console.error("Failed to load guide", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuide();
    }, [id]);

    const handleSave = async (data: any) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/guides/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push(`/core/programs/guides/${id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
             <CoreWrapper>
                <div className="flex justify-center pt-40">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            </CoreWrapper>
        );
    }

    if (!guide) return <CoreWrapper><div className="pt-40 text-center text-zinc-500">Guide not found</div></CoreWrapper>;

    return (
        <CoreWrapper>
            <CorePageHeader 
                title="Edit Program Guide" 
                description="Update the program framework."
                icon={<Layers className="w-5 h-5 text-zinc-200" />}
            />
            <GuideBuilder 
                initialData={guide}
                type="PROGRAM" 
                onSave={handleSave} 
                isSaving={isSaving} 
            />
        </CoreWrapper>
    );
}
