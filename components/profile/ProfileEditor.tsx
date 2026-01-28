"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Toast } from "@/components/ui/Toast";
import { User, Save, Send, Twitter, Wallet, MapPin, Loader2, ArrowLeft, MessageCircle, ChevronDown, Search, Check, Shield, Info, Upload as UploadIcon, Plus, Trash2, Link as LinkIcon, Edit2, Globe, Briefcase, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/data/indian-states";
import { upload } from "@vercel/blob/client";

interface SocialProfile {
    name: string;
    url: string;
}

const AVAILABLE_ROLES = ["Developer", "Marketing", "Business Development", "Designer", "Community Manager", "Founder", "Investor", "Other"];
const PREDEFINED_INTERESTS = [
    "DeFi", "NFTs", "Gaming", "DAO", "Infrastructure", "Social", "Mobile", "Zero Knowledge", "Consumer",
    "AI", "RWAs", "Security", "Analytics", "Trading", "Governance"
];

const AVAILABILITY_OPTIONS = [
    "Open to Hack", "Looking for Co-founder", "Hiring", "Just Exploring", "Not Available"
];

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
    const isMemberContext = backHref.startsWith("/member");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profileImage, setProfileImage] = useState<string>("");
    const [imageCacheBust, setImageCacheBust] = useState<number>(0);
    
    // Image Upload Handler (use Vercel Blob like Public Profile)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/upload/token",
            });

            // Persist to DB (CORE -> Member.image, MEMBER -> customFields.profileImage)
            const patchRes = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: newBlob.url }),
            });
            if (!patchRes.ok) throw new Error("Upload failed");

            setProfileImage(newBlob.url);
            setImageCacheBust(Date.now());
            setProfileImageError(false);
            await updateSession(); // Refresh session (best-effort)
            
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const [formData, setFormData] = useState({
        name: "",
        xHandle: "",
        telegram: "",
        wallet: "",
        address: "",
        discord: "",
        bio: ""
    });

    const buildImageSrc = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        // Only cache-bust when we explicitly updated the image (upload/fetch),
        // otherwise this will re-request on every render and can trigger broken loads.
        if (url.includes(".public.blob.vercel-storage.com") && imageCacheBust) {
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}t=${imageCacheBust}`;
        }
        return url;
    };

    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setProfileImage(data.image || "");
                setImageCacheBust(Date.now());
                setProfileImageError(false);
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
        // If the image URL changes, allow a fresh attempt to render it.
        setProfileImageError(false);
    }, [profileImage, (session?.user as any)?.image]);

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

            if (!res.ok) throw new Error("Failed to save profile");

            // Save extra profile together (single Save button)
            if (isMemberContext) {
                const extraRes = await fetch("/api/profile/extra", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(extra),
                });
                if (!extraRes.ok) throw new Error("Failed to save additional profile");
            }

            // refresh image/profile fields
            await fetchProfile();
            if (isMemberContext) await fetchExtra();
            await updateSession();
            setIsEditing(false);
            setShowToast(true);
        } catch (error) {
            console.error(error);
            alert("Failed to save. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Extra (Public-style) Profile Section (Member context only) ---
    const [extra, setExtra] = useState<{
        availability: string;
        currentProject: string;
        country: string;
        city: string;
        roles: string[];
        interests: string[];
        skills: string[];
        socialProfiles: SocialProfile[];
    }>({
        availability: "Just Exploring",
        currentProject: "",
        country: "",
        city: "",
        roles: [],
        interests: [],
        skills: [],
        socialProfiles: []
    });
    const [extraLoaded, setExtraLoaded] = useState(false);
    const [extraError, setExtraError] = useState<string>("");
    const [newSkill, setNewSkill] = useState("");
    const [newInterest, setNewInterest] = useState("");
    const [newSocial, setNewSocial] = useState<SocialProfile>({ name: "", url: "" });

    const fetchExtra = async () => {
        try {
            const res = await fetch("/api/profile/extra");
            if (!res.ok) return;
            const data = await res.json();
            setExtra({
                availability: data.availability || "Just Exploring",
                currentProject: data.currentProject || "",
                country: data.country || "",
                city: data.city || "",
                roles: Array.isArray(data.roles) ? data.roles : [],
                interests: Array.isArray(data.interests) ? data.interests : [],
                skills: Array.isArray(data.skills) ? data.skills : [],
                socialProfiles: Array.isArray(data.socialProfiles) ? data.socialProfiles : []
            });
            setExtraLoaded(true);
        } catch (e) {
            console.error("Failed to fetch extra profile:", e);
        }
    };

    useEffect(() => {
        if (session?.user && isMemberContext) {
            fetchExtra();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, isMemberContext]);

    const addSkill = (e?: React.KeyboardEvent<HTMLInputElement>) => {
        if (e && e.key !== "Enter" && e.key !== ",") return;
        if (e) e.preventDefault();
        const skill = newSkill.trim();
        if (!skill) return;
        if (extra.skills.includes(skill)) {
            setNewSkill("");
            return;
        }
        setExtra(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        setNewSkill("");
    };
    const removeSkill = (skill: string) => setExtra(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));

    const addInterest = (custom?: string) => {
        const val = (custom || newInterest).trim();
        if (!val) return;
        if (extra.interests.length >= 10) return;
        if (extra.interests.includes(val)) return;
        setExtra(prev => ({ ...prev, interests: [...prev.interests, val] }));
        if (!custom) setNewInterest("");
    };
    const removeInterest = (interest: string) => setExtra(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));

    const toggleRole = (role: string) => {
        setExtra(prev => {
            if (prev.roles.includes(role)) return { ...prev, roles: prev.roles.filter(r => r !== role) };
            if (prev.roles.length >= 3) return prev;
            return { ...prev, roles: [...prev.roles, role] };
        });
    };

    const addSocial = () => {
        const name = newSocial.name.trim();
        const url = newSocial.url.trim();
        if (!name || !url) return;
        setExtra(prev => ({ ...prev, socialProfiles: [...prev.socialProfiles, { name, url }] }));
        setNewSocial({ name: "", url: "" });
    };
    const removeSocial = (idx: number) => setExtra(prev => ({ ...prev, socialProfiles: prev.socialProfiles.filter((_, i) => i !== idx) }));

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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <User className="w-5 h-5 text-zinc-200" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Profile</h1>
                            <p className="text-sm text-zinc-400">Manage your public information and private details.</p>
                        </div>
                    </div>
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors rounded-lg flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    setIsEditing(false);
                                    await fetchProfile();
                                    if (isMemberContext) await fetchExtra();
                                }}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSubmit(e as any);
                                }}
                                disabled={isLoading}
                                className="px-4 py-2 bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Read Only Card */}
                {/* Read Only Card - Enhanced */}
                <div className="relative overflow-hidden p-0 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl h-fit group">
                    {/* Decorative Background Header */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 p-6 flex flex-col items-center text-center pt-8">
                        {/* Avatar with Glow & Upload */}
                        <div className="relative mb-5 group-hover:scale-105 transition-transform duration-500">
                             <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-110" />
                             
                             <div className="relative group/edit">
                                 {(profileImage || session?.user?.image) && !profileImageError ? (
                                    <img 
                                        src={buildImageSrc(profileImage || session?.user?.image) || profileImage || session?.user?.image || ''} 
                                        alt="Profile" 
                                        className="relative w-28 h-28 rounded-full border-4 border-zinc-900 ring-1 ring-white/20 shadow-2xl object-cover" 
                                        onError={() => setProfileImageError(true)}
                                    />
                                ) : (
                                    <div className="relative w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-900 ring-1 ring-white/20 shadow-2xl">
                                        <User className="w-10 h-10 text-zinc-500" />
                                    </div>
                                )}

                                {/* Upload Overlay - Only show when editing */}
                                {isEditing && (
                                    <div 
                                        className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/edit:opacity-100 transition-opacity cursor-pointer z-20"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {isUploadingImage ? (
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        ) : (
                                            <>
                                                <UploadIcon className="w-6 h-6 text-white mb-1" />
                                                <span className="text-[8px] uppercase font-bold text-zinc-300 tracking-wider">Change</span>
                                            </>
                                        )}
                                    </div>
                                )}
                             </div>
                             
                             <input 
                                 type="file" 
                                 ref={fileInputRef} 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={handleImageUpload} 
                             />
                        </div>

                        {/* Name & Email */}
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{formData.name || session?.user?.name}</h2>
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
                        <SettingsIcon /> {isEditing ? "Edit Details" : "Profile Details"}
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
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^[a-zA-Z\s]*$/.test(val)) {
                                                setFormData({...formData, name: val});
                                            }
                                        }}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!isEditing}
                                        value={formData.xHandle}
                                        onChange={(e) => setFormData({...formData, xHandle: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!isEditing}
                                        value={formData.telegram}
                                        onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!isEditing}
                                        value={formData.wallet}
                                        onChange={(e) => setFormData({...formData, wallet: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!isEditing}
                                        value={formData.discord}
                                        onChange={(e) => setFormData({...formData, discord: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!isEditing}
                                    />

                                    {/* City Input */}
                                    <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                            <input 
                                            type="text" 
                                            disabled={!isEditing}
                                            value={selectedCity}
                                            onChange={(e) => handleLocationChange(selectedState, e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="City Name"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Bio</label>
                            <textarea 
                                disabled={!isEditing}
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                    </form>

                    {/* Extra public-style fields (member profile only) */}
                    {isMemberContext && (
                        <div className="mt-10 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-6">
                                <Briefcase className="w-4 h-4 text-zinc-400" />
                                <h4 className="text-sm font-bold text-white">Additional Details</h4>
                            </div>

                            {extraError && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {extraError}
                                </div>
                            )}

                            {!isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Professional (view) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-bold text-white">Professional</div>
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> Optional
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase">Availability</div>
                                                <div className="text-sm text-white text-right">{extra.availability || "—"}</div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase">Current project</div>
                                                <div className="text-sm text-white text-right">{extra.currentProject || "—"}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</div>
                                                    <div className="text-sm text-white">{extra.country || "—"}</div>
                                                </div>
                                                <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">City</div>
                                                    <div className="text-sm text-white">{extra.city || "—"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Links (view) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                        <div className="text-sm font-bold text-white mb-4">Social Links</div>
                                        {extra.socialProfiles.length === 0 ? (
                                            <div className="text-sm text-zinc-500">—</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {extra.socialProfiles.map((s, idx) => (
                                                    <a
                                                        key={`${s.name}-${idx}`}
                                                        href={s.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="text-sm text-white font-medium truncate">{s.name}</div>
                                                            <div className="text-xs text-zinc-500 truncate">{s.url}</div>
                                                        </div>
                                                        <LinkIcon className="w-4 h-4 text-zinc-500" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills (view) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-bold text-white">Skills</div>
                                            <div className="text-[10px] text-zinc-500">{extra.skills.length}/50</div>
                                        </div>
                                        {extra.skills.length === 0 ? (
                                            <div className="text-sm text-zinc-500">—</div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {extra.skills.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-200"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Interests + Roles (view) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-sm font-bold text-white">Interests</div>
                                                <div className="text-[10px] text-zinc-500">{extra.interests.length}/10</div>
                                            </div>
                                            {extra.interests.length === 0 ? (
                                                <div className="text-sm text-zinc-500">—</div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {extra.interests.map((i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-200"
                                                        >
                                                            {i}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-sm font-bold text-white">Roles (Max 3)</div>
                                                <div className="text-[10px] text-zinc-500">{extra.roles.length}/3</div>
                                            </div>
                                            {extra.roles.length === 0 ? (
                                                <div className="text-sm text-zinc-500">—</div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {extra.roles.map((r) => (
                                                        <span
                                                            key={r}
                                                            className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-200"
                                                        >
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Professional (edit) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-bold text-white">Professional</div>
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> Optional
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Availability</label>
                                                <select
                                                    value={extra.availability}
                                                    onChange={(e) => setExtra(prev => ({ ...prev, availability: e.target.value }))}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                >
                                                    {AVAILABILITY_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Current project</label>
                                                <input
                                                    value={extra.currentProject}
                                                    onChange={(e) => setExtra(prev => ({ ...prev, currentProject: e.target.value }))}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                    placeholder="e.g. Building a consumer app"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Country</label>
                                                    <input
                                                        value={extra.country}
                                                        onChange={(e) => setExtra(prev => ({ ...prev, country: e.target.value }))}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                        placeholder="Select Country"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">City</label>
                                                    <input
                                                        value={extra.city}
                                                        onChange={(e) => setExtra(prev => ({ ...prev, city: e.target.value }))}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                        placeholder="e.g. Bengaluru"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Links (edit) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                        <div className="text-sm font-bold text-white mb-4">Social Links</div>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 gap-2">
                                                <input
                                                    value={newSocial.name}
                                                    onChange={(e) => setNewSocial(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                    placeholder="Label (e.g. Portfolio)"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        value={newSocial.url}
                                                        onChange={(e) => setNewSocial(prev => ({ ...prev, url: e.target.value }))}
                                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                        placeholder="https://..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addSocial}
                                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white"
                                                        title="Add link"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {extra.socialProfiles.length === 0 ? (
                                                    <div className="text-sm text-zinc-500">—</div>
                                                ) : (
                                                    extra.socialProfiles.map((s, idx) => (
                                                        <div key={`${s.name}-${idx}`} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                                                            <div className="min-w-0">
                                                                <div className="text-sm text-white font-medium truncate">{s.name}</div>
                                                                <div className="text-xs text-zinc-500 truncate">{s.url}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSocial(idx)}
                                                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                title="Remove"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills (edit) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-bold text-white">Skills</div>
                                            <div className="text-[10px] text-zinc-500">{extra.skills.length}/50</div>
                                        </div>
                                        <div className="space-y-3">
                                            <input
                                                value={newSkill}
                                                onChange={(e) => setNewSkill(e.target.value)}
                                                onKeyDown={addSkill}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                placeholder="+ Add Skill (Press Enter)"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {extra.skills.length === 0 ? (
                                                    <div className="text-sm text-zinc-500">—</div>
                                                ) : (
                                                    extra.skills.map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => removeSkill(s)}
                                                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-zinc-200 flex items-center gap-2"
                                                            title="Remove"
                                                        >
                                                            {s} <X className="w-3 h-3 text-zinc-500" />
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interests + Roles (edit) */}
                                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-sm font-bold text-white">Interests</div>
                                                <div className="text-[10px] text-zinc-500">{extra.interests.length}/10</div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {PREDEFINED_INTERESTS.map((i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => extra.interests.includes(i) ? removeInterest(i) : addInterest(i)}
                                                            className={cn(
                                                                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                                                                extra.interests.includes(i)
                                                                    ? "bg-white text-black border-white"
                                                                    : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            {i}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={newInterest}
                                                        onChange={(e) => setNewInterest(e.target.value)}
                                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                                        placeholder="Custom interest..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => addInterest()}
                                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white"
                                                        title="Add"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {extra.interests.length === 0 ? (
                                                        <div className="text-sm text-zinc-500">—</div>
                                                    ) : (
                                                        extra.interests.map((i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => removeInterest(i)}
                                                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-zinc-200 flex items-center gap-2"
                                                                title="Remove"
                                                            >
                                                                {i} <X className="w-3 h-3 text-zinc-500" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-sm font-bold text-white">Roles (Max 3)</div>
                                                <div className="text-[10px] text-zinc-500">{extra.roles.length}/3</div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {AVAILABLE_ROLES.map((r) => (
                                                        <button
                                                            key={r}
                                                            type="button"
                                                            onClick={() => toggleRole(r)}
                                                            className={cn(
                                                                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                                                                extra.roles.includes(r)
                                                                    ? "bg-white text-black border-white"
                                                                    : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            {r}
                                                        </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
