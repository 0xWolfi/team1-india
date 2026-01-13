'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { GuideDetail } from '@/components/guides/GuideDetail';
import { Loader2 } from 'lucide-react';

export default function MemberEventGuideDetailPage() {
    const params = useParams();
    const router = useRouter();
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
                    // Check if member has access (MEMBER or PUBLIC visibility)
                    if (data.visibility === 'MEMBER' || data.visibility === 'PUBLIC') {
                        setGuide(data);
                    } else {
                        setError('Access denied: This guide is not available to members.');
                    }
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
            <MemberWrapper>
                <div className="flex justify-center pt-40">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            </MemberWrapper>
        );
    }

    if (error || !guide) {
        return (
            <MemberWrapper>
                <div className="flex flex-col items-center justify-center pt-40 text-zinc-500">
                    <p>{error || "Guide not found"}</p>
                </div>
            </MemberWrapper>
        );
    }

    return (
        <MemberWrapper>
            <GuideDetail guide={guide} />
        </MemberWrapper>
    );
}
