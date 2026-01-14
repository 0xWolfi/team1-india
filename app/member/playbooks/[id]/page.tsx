'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
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
            <Link href="/member" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <div className="max-w-4xl mx-auto">
                {/* Cover Image */}
                {playbook.coverImage && (
                    <div className="w-full h-64 rounded-2xl overflow-hidden mb-8 border border-white/10">
                        <img
                            src={playbook.coverImage}
                            alt={playbook.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-white mb-4">{playbook.title}</h1>

                {/* Description */}
                {playbook.description && (
                    <p className="text-zinc-400 text-lg mb-8">{playbook.description}</p>
                )}

                {/* Visibility Badge */}
                <div className="mb-8">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        playbook.visibility === 'PUBLIC'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                        {playbook.visibility}
                    </span>
                </div>

                {/* Content */}
                <Editor
                    // Playbook content is stored in `body` (BlockNote JSON)
                    initialContent={playbook.body}
                    editable={false}
                    onChange={() => {}}
                />
            </div>
        </MemberWrapper>
    );
}
