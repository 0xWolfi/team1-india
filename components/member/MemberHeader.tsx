"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";



export function MemberHeader({ user, onOpenContribution }: { user?: any, onOpenContribution: () => void }) {
    const [profileImageError, setProfileImageError] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageCacheBust, setImageCacheBust] = useState<number>(0);

    // Fetch latest profile image from API (not session, which can be stale)
    const fetchProfileImage = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.image) {
                    setProfileImage(data.image);
                    setImageCacheBust(Date.now());
                    setProfileImageError(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile image:", error);
        }
    };

    useEffect(() => {
        fetchProfileImage();
        // Listen for profile updates (triggered after saving profile)
        const handleProfileUpdate = () => {
            fetchProfileImage();
        };
        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, []);

    const buildImageSrc = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        // Only cache-bust when we explicitly fetched a new image
        if (url.includes(".public.blob.vercel-storage.com") && imageCacheBust) {
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}t=${imageCacheBust}`;
        }
        return url;
    };

    // Use fetched image, fallback to session image
    const displayImage = profileImage || user?.image;

    return (
        <header className="mb-6 md:mb-8 border-b border-white/5 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
            <div className="flex-1">
                 {/* Mobile Top Row: Title + Actions */}
                 <div className="flex items-center justify-between md:block">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                         <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                         <span className="text-[10px] md:text-xs font-mono text-zinc-500 tracking-widest uppercase">Member Portal</span>
                    </div>

                    {/* Mobile Actions: HIDDEN (Moved to sticky nav) */}
                 </div>

                <div className="flex items-center gap-4">
                    {displayImage && !profileImageError ? (
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg ring-2 ring-white/10 overflow-hidden flex-shrink-0">
                            <Image 
                                src={buildImageSrc(displayImage) || displayImage} 
                                alt="Profile" 
                                fill
                                className="object-cover"
                                onError={() => setProfileImageError(true)}
                                unoptimized={displayImage.startsWith('data:') || displayImage.startsWith('blob:')}
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-zinc-800 flex items-center justify-center ring-2 ring-white/10 flex-shrink-0">
                            <User className="w-8 h-8 md:w-10 md:h-10 text-zinc-400" />
                        </div>
                    )}
                </div>
                <p className="text-zinc-500 font-medium text-xs md:text-sm mt-1 md:mt-2 max-w-lg leading-relaxed">
                    Welcome back, <span className="text-white">{user?.name || 'Member'}</span>.
                </p>
            </div>
            
            {/* Desktop Actions (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-6">
                <button
                    onClick={onOpenContribution}
                    className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold tracking-wide hover:bg-zinc-200 border border-white/10 shadow-lg shadow-white/5 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                    submit your contributions
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                    <Link 
                        href="/member/profile"
                        className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center text-zinc-400 hover:text-white"
                        title="My Profile"
                    >
                        <User className="w-4 h-4" />
                    </Link>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/public' })}
                        className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center text-red-500 hover:text-red-400"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
