'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { GuideDetail } from '@/components/guides/GuideDetail';
import { Loader2 } from 'lucide-react';

export default function ContentGuideDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [guide, setGuide] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchGuide = async () => {
            try {
                const res = await fetch(`/api/guides/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGuide(data);
                } else {
                    setError('Guide not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load guide');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuide();
    }, [id]);

    if (isLoading) {
        return (
            <CoreWrapper>
                <div className="flex justify-center pt-40">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            </CoreWrapper>
        );
    }

    if (error || !guide) {
         return (
            <CoreWrapper>
                <div className="flex flex-col items-center justify-center pt-40 text-zinc-500">
                    <p>{error || "Guide not found"}</p>
                </div>
            </CoreWrapper>
        );
    }

    return (
        <CoreWrapper>
            <GuideDetail guide={guide} basePath="/core" />
        </CoreWrapper>
    );
}
