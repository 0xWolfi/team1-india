"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Toast } from "@/components/ui/Toast";
import { User, Save, Send, Twitter, Wallet, MapPin, Loader2, ArrowLeft, MessageCircle, ChevronDown, Search, Check, Shield, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/data/indian-states";

interface SearchableDropdownProps {
    label: string;
    placeholder: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

function SearchableDropdown({ label, placeholder, options, value, onChange, isLoading, disabled }: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset search when opening
    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer flex items-center justify-between min-h-[38px]",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "border-white/30 ring-1 ring-white/10"
                )}
            >
                <span className={cn(!value && "text-zinc-500")}>
                    {value || placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-2 top-2 w-3 h-3 text-zinc-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-zinc-800/100 border border-white/5 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:bg-zinc-800"
                                placeholder={`Search ${label}...`}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                        {isLoading ? (
                             <div className="flex items-center justify-center py-4 text-zinc-500 gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Loading...</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="px-2 py-4 text-center text-xs text-zinc-500">
                                No results found.
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-md cursor-pointer flex items-center justify-between group transition-colors",
                                        value === option && "bg-white/10 text-white font-bold"
                                    )}
                                >
                                    {option}
                                    {value === option && <Check className="w-3 h-3 text-white" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface ProfileEditorProps {
    backHref: string;
    backLabel: string;
}

export function ProfileEditor({ backHref, backLabel }: ProfileEditorProps) {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        xHandle: "",
        telegram: "",
        wallet: "",
        address: "",
        discord: "",
        bio: ""
    });

    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

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
                    discord: data.discord || "",
                    bio: data.bio || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    // Parse address into State/City
    useEffect(() => {
        if (formData.address) {
            const parts = formData.address.split(',').map(s => s.trim());
            if (parts.length >= 2) {
                const potentialCity = parts[0];
                const potentialState = parts[1];
                setSelectedState(potentialState);
                setSelectedCity(potentialCity);
            }
        }
    }, [formData.address]);

    const handleLocationChange = (state: string, city: string) => {
        setSelectedState(state);
        setSelectedCity(city);
        if (state && city) {
            setFormData(prev => ({ ...prev, address: `${city}, ${state}` }));
        } else if (state) {
             setFormData(prev => ({ ...prev, address: `${state}` }));
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
                        discord: formData.discord,
                        bio: formData.bio
                    }
                })
            });

            if (res.ok) {
                await updateSession();
                setShowToast(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Toast
                message="Your profile has been saved successfully!"
                type="success"
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
            <Link href={backHref} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
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
                {/* Read Only Card - Enhanced */}
                <div className="relative overflow-hidden p-0 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl h-fit group">
                    {/* Decorative Background Header */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 p-6 flex flex-col items-center text-center pt-8">
                        {/* Avatar with Glow */}
                        <div className="relative mb-5 group-hover:scale-105 transition-transform duration-500">
                             <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-110" />
                             {session?.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="relative w-28 h-28 rounded-full border-4 border-zinc-900 ring-1 ring-white/20 shadow-2xl object-cover" />
                            ) : (
                                <div className="relative w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-900 ring-1 ring-white/20 shadow-2xl">
                                    <User className="w-10 h-10 text-zinc-500" />
                                </div>
                            )}
                        </div>

                        {/* Name & Email */}
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{session?.user?.name}</h2>
                        <p className="text-sm font-medium text-zinc-500 mb-8 font-mono">{session?.user?.email}</p>

                        {/* Info/Stats Block */}
                        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 backdrop-blur-sm">
                            
                            {/* Role Row */}
                            <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                     <Shield className="w-3.5 h-3.5 text-zinc-500" />
                                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Role</span>
                                 </div>
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10 shadow-sm">
                                    {(() => {
                                        const tags = (session?.user as any)?.tags;
                                        const role = (session?.user as any)?.role;
                                        if (role === 'CORE' && Array.isArray(tags) && tags.length > 0) return tags.join(', ');
                                        if (role === 'MEMBER' && tags) return tags;
                                        return role || 'Member';
                                    })()}
                                 </span>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />

                            {/* Admin Note */}
                            <div className="flex gap-3 text-left">
                                <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed text-zinc-500">
                                    Email is managed by the administrator. Contact support for changes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 p-6 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
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
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^[a-zA-Z\s]*$/.test(val)) {
                                                setFormData({...formData, name: val});
                                            }
                                        }}
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
                                <label className="text-xs font-bold text-zinc-400 uppercase">Discord Handle</label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        value={formData.discord}
                                        onChange={(e) => setFormData({...formData, discord: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                        placeholder="@username or username#1234"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase">State & City</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* State Selector */}
                                    <SearchableDropdown 
                                        label="State"
                                        placeholder="Select State"
                                        options={INDIAN_STATES}
                                        value={selectedState}
                                        onChange={(val) => handleLocationChange(val, selectedCity)}
                                        isLoading={false}
                                    />

                                    {/* City Input */}
                                    <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                            <input 
                                            type="text" 
                                            value={selectedCity}
                                            onChange={(e) => handleLocationChange(selectedState, e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                            placeholder="City Name"
                                        />
                                    </div>
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
        </div>
    );
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    )
}
