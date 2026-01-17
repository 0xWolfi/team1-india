"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { Toast } from "@/components/ui/Toast";
import { User, Save, Send, Twitter, Wallet, MapPin, Loader2, ArrowLeft, MessageCircle, ChevronDown, Search, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// --- API Helpers ---
const API_BASE = "https://countriesnow.space/api/v0.1/countries";

async function fetchStates() {
    try {
        const res = await fetch(`${API_BASE}/states`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "India" }),
        });
        const data = await res.json();
        return data.data?.states?.map((s: any) => s.name) || [];
    } catch (e) {
        console.error("Failed to fetch states", e);
        return [];
    }
}

async function fetchCities(state: string) {
    try {
        const res = await fetch(`${API_BASE}/state/cities`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "India", state }),
        });
        const data = await res.json();
        return data.data || [];
    } catch (e) {
        console.error("Failed to fetch cities", e);
        return [];
    }
}

// --- Components ---

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
                                        value === option && "bg-indigo-500/10 text-indigo-400"
                                    )}
                                >
                                    {option}
                                    {value === option && <Check className="w-3 h-3" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function ProfilePage() {
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

    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isFetchingStates, setIsFetchingStates] = useState(false);
    const [isFetchingCities, setIsFetchingCities] = useState(false);

    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    // Load States on Mount
    useEffect(() => {
        async function loadStates() {
            setIsFetchingStates(true);
            const list = await fetchStates();
            setStates(list);
            setIsFetchingStates(false);
        }
        loadStates();
    }, []);

    // Load Cities when State changes
    useEffect(() => {
        if (selectedState) {
            async function loadCities() {
                setIsFetchingCities(true);
                const list = await fetchCities(selectedState);
                setCities(list);
                setIsFetchingCities(false);
            }
            loadCities();
        } else {
            setCities([]);
        }
    }, [selectedState]);

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    // Parse address into State/City
    useEffect(() => {
        if (formData.address) {
            // Address format: "City, State"
            const parts = formData.address.split(',').map(s => s.trim());
            if (parts.length >= 2) {
                // Try to match basic format
                const potentialCity = parts[0];
                const potentialState = parts[1];
                
                // We set them as selected even if API hasn't loaded logic yet
                // However, we ideally want to wait for state list. 
                // For simplicity, we just set them. SearchableDropdown will show them as value even if not in list initially?
                // Actually SearchableDropdown displays 'value' prop directly.
                setSelectedState(potentialState);
                setSelectedCity(potentialCity);
            }
        }
    }, [formData.address]);

    // Update formData.address when State/City changes
    // We only update if USER interacts (we check if they match internal state to avoid loop overwrites?)
    // Actually, simple effect is fine as long as we don't cause infinite loop.
    const handleLocationChange = (state: string, city: string) => {
        setSelectedState(state);
        setSelectedCity(city);
        if (state && city) {
            setFormData(prev => ({ ...prev, address: `${city}, ${state}` }));
        } else if (state) {
             setFormData(prev => ({ ...prev, address: `${state}` }));
        }
    };

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
        <MemberWrapper>
            <Toast
                message="Your profile has been saved successfully!"
                type="success"
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
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
                <div className="p-6 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl h-fit">
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
                                <label className="text-xs font-bold text-zinc-400 uppercase">City, State</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* State Selector */}
                                    <SearchableDropdown 
                                        label="State"
                                        placeholder="Select State"
                                        options={states}
                                        value={selectedState}
                                        onChange={(val) => handleLocationChange(val, "")} // Reset city
                                        isLoading={isFetchingStates}
                                    />

                                    {/* City Selector */}
                                     <SearchableDropdown 
                                        label="City"
                                        placeholder="Select City"
                                        options={cities}
                                        value={selectedCity}
                                        onChange={(val) => handleLocationChange(selectedState, val)}
                                        isLoading={isFetchingCities}
                                        disabled={!selectedState}
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
