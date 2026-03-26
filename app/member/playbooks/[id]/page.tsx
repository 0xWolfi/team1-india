'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { Loader2 } from "lucide-react";
import { PlaybookShell } from "@/components/playbooks/PlaybookShell";
import Editor from '@/components/playbooks/Editor';

export default function MemberPlaybookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [playbook, setPlaybook] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchPlaybook = async () => {
            try {
                const res = await fetch(`/api/playbooks/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    // Check if member has access (MEMBER or PUBLIC visibility)
                    if (data.visibility === 'MEMBER' || data.visibility === 'PUBLIC') {
                        setPlaybook(data);
                    } else {
                        setError('Access denied: This playbook is not available to members.');
                    }
                } else {
                    setError('Playbook not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load playbook');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlaybook();
    }, [id]);

    if (isLoading) {
        return (
            <MemberWrapper>
                <div className="flex justify-center pt-40">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500"/>
                </div>
            </MemberWrapper>
        );
    }

    if (error || !playbook) {
        return (
            <MemberWrapper>
                <div className="flex flex-col items-center justify-center pt-40 text-zinc-500">
                    <p>{error || "Playbook not found"}</p>
                </div>
            </MemberWrapper>
        );
    }

    return (
        <MemberWrapper>
            <PlaybookShell 
                playbook={playbook}
                backLink="/member"
                backLabel="Back to Dashboard"
                className="pt-0 min-h-[calc(100vh-80px)]" // Outer adjustment
                contentClassName="pt-0 px-0" // Inner adjustment (remove double padding)
            >
                <Editor
                    initialContent={playbook.body}
                    editable={false}
                    onChange={() => {}}
                />
            </PlaybookShell>
        </MemberWrapper>
    );
}
