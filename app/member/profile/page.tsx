"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { User, Save, Send, Twitter, Wallet, MapPin, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        xHandle: "",
        telegram: "",
        wallet: "",
        address: "",
        twitter: "",
        bio: ""
    });

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    xHandle: data.xHandle || "",
                    telegram: data.telegram || "",
                    wallet: data.wallet || "",
                    address: data.address || "",
                    twitter: data.twitter || "",
                    bio: data.bio || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    xHandle: formData.xHandle,
                    telegram: formData.telegram,
                    customFields: {
                        wallet: formData.wallet,
                        address: formData.address,
                        twitter: formData.twitter,
                        bio: formData.bio
                    }
                })
            });

            if (res.ok) {
                await updateSession();
                router.push("/member");
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MemberWrapper>
            <Link href="/member" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>
            
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <User className="w-5 h-5 text-zinc-200" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Profile</h1>
                        <p className="text-sm text-zinc-400">Manage your public information and private details.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Read Only Card */}
                <div className="p-6 bg-zinc-900 border border-white/5 rounded-xl h-fit">
                    <div className="flex flex-col items-center text-center">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white/5 mb-4" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-white/5 mb-4">
                                <User className="w-10 h-10 text-zinc-500" />
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-white">{session?.user?.name}</h2>
                        <p className="text-sm text-zinc-500 mb-4">{session?.user?.email}</p>
                        
                        <div className="w-full pt-4 border-t border-white/5 text-left space-y-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Role</label>
                                {/* @ts-ignore */}
                                <p className="text-sm text-zinc-300">
                                    {(() => {
                                        const tags = (session?.user as any)?.tags;
                                        const role = (session?.user as any)?.role;

                                        // For CORE members, show tags array
                                        if (role === 'CORE' && Array.isArray(tags) && tags.length > 0) {
                                            return tags.join(', ');
                                        }

                                        // For MEMBER (community), show tags string
                                        if (role === 'MEMBER' && tags) {
                                            return tags;
                                        }

                                        // Fallback to role
                                        return role || 'Member';
                                    })()}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-blue-400">
                                    Email is managed by the administrator. You can update your name and other details below.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 p-6 bg-zinc-900 border border-white/5 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <SettingsIcon /> Edit Details
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Full Name <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Username (X Handle) <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Twitter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.xHandle}
                                        onChange={(e) => setFormData({...formData, xHandle: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="@username"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Telegram Handle <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Send className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.telegram}
                                        onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="@username"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Wallet Address <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.wallet}
                                        onChange={(e) => setFormData({...formData, wallet: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="0x..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">X (Twitter) URL</label>
                                <div className="relative">
                                    <Twitter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="url" 
                                        value={formData.twitter}
                                        onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="https://x.com/username"
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Location / Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="City, Country"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Bio</label>
                            <textarea 
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 min-h-[100px]"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MemberWrapper>
    );
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    )
}
