"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { HelpfulWidget } from "./HelpfulWidget";
import { Footer } from "@/components/website/Footer";
import { cn } from "@/lib/utils";
import { TableOfContents } from "./TableOfContents";
import { ImageCropper } from "../ui/ImageCropper"; // Import Cropper

interface PlaybookShellProps {
    playbook: {
        id: string;
        title: string;
        description?: string;
        coverImage?: string;
        createdAt?: string | Date;
        updatedAt: string | Date;
        createdBy?: { email: string; name?: string };
        body?: any;
    };
    backLink: string;
    backLabel?: string;
    children: React.ReactNode;
    sidebarActions?: React.ReactNode; 
    headerActions?: React.ReactNode; 
    className?: string; 
    contentClassName?: string;
    isEditing?: boolean;
    onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDescriptionChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onCoverImageChange?: (url: string | undefined) => void;
    readTime?: string;
}

export function PlaybookShell({ 
    playbook, 
    backLink, 
    backLabel = "Back to Dashboard", 
    children, 
    sidebarActions, 
    headerActions,
    className,
    contentClassName,
    isEditing = false,
    onTitleChange,
    onDescriptionChange,
    onCoverImageChange,
    readTime
}: PlaybookShellProps) {

    // Cropper & Upload States
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // 1. Intercept Selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Read file as URL for Cropper
        const reader = new FileReader();
        reader.addEventListener("load", () => {
             setCropperSrc(reader.result?.toString() || null);
        });
        reader.readAsDataURL(file);
        
        // Reset input to allow re-selecting same file
        e.target.value = ""; 
    };

    // 2. Upload Cropped Blob
    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropperSrc(null); // Close Cropper
        setIsUploading(true); // Show Loader

        if (!onCoverImageChange) return;

        try {
            const formData = new FormData();
            formData.append('file', croppedBlob, 'cover.jpg'); 
            
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                onCoverImageChange(data.url);
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error(err);
            alert("Upload error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCopyMarkdown = () => {
        const content = typeof playbook.body === 'string' ? playbook.body : JSON.stringify(playbook.body, null, 2);
        navigator.clipboard.writeText(content);
    };

    return (
        <div className={cn("min-h-screen text-white selection:bg-purple-500/30 font-sans", className)}>
            
            {/* Cropper Modal */}
            {cropperSrc && (
                <ImageCropper 
                    imageSrc={cropperSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropperSrc(null)}
                    aspectRatio={4 / 1} // Flexible banner aspect ratio? Or fixed dimensions? User said "auto croping not letting me crop". A wide banner is usually 3:1 or 4:1. Let's try 4:1 (e.g. 1200x300, 1600x400) or maybe just free? No, user wants it to fit H-[400px].
                    // Actually, since width is max-w-4xl (896px) and height is fixed 400px, responsive aspect changes.
                    // But usually for banners we pick a wide ratio. Let's prioritize 16:9 or free?
                    // User complained about "auto crop".
                    // Let's use 2.5:1 as a safe banner default, or allow the cropper to be free?
                    // Re-reading: "auto croping not letting me crop also or zoom". 
                    // Let's set aspect ratio to ~2.2 (896/400 = 2.24) to match the desktop view.
                />
            )}

            {/* Top Navigation Bar: Actions Only (Save/Cancel/Back) */}
            <div className="fixed top-0 w-full z-50 px-6 h-16 flex items-center justify-between pointer-events-none">
                 <div /> {/* Spacer */}
                 {headerActions && (
                    <div className="flex items-center gap-3 pointer-events-auto bg-black/50 backdrop-blur-md rounded-full px-4 py-2 mt-4 border border-white/10">
                        {headerActions}
                    </div>
                 )}
            </div>

            <div className={cn("max-w-[1400px] mx-auto px-6 pt-24 pb-12", contentClassName)}>
                
                {/* ==================================================================================
                    HEADER AREA: Banner + Title + Description
                    Strictly separated for View vs Edit to prevent Duplication
                   ================================================================================== */}
                
                {isEditing ? (
                    // ------------------ EDIT MODE HEADER ------------------
                    <div className="space-y-6 mb-8 animate-in fade-in duration-300">
                        
                        {/* 1. Editable Cover Area */}
                        <div className="relative w-full group">
                            {playbook.coverImage ? (
                                <div className="relative w-full rounded-2xl overflow-hidden h-[400px] border border-white/10 bg-zinc-900/50 shadow-2xl transition-all hover:border-white/20">
                                    <img src={playbook.coverImage} className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-50' : 'opacity-100'}`} />
                                    
                                    {/* Uploading Spinner */}
                                    {isUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
                                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                        </div>
                                    )}

                                    {/* Remove Cover Button */}
                                    {!isUploading && (
                                    <button 
                                        onClick={() => onCoverImageChange?.(undefined)}
                                        className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-red-500/90 rounded-xl text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10 z-30 shadow-lg"
                                        title="Remove Cover"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    )}
                                    {/* Back Button */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <Link 
                                            href={backLink} 
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/40 text-white hover:bg-black/60 transition-all border border-white/10 backdrop-blur-md"
                                            title={backLabel}
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                /* Placeholder Box: "Add Cover" - Sleeker Design */
                                <div className="w-full rounded-2xl h-[280px] border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center gap-4 transition-all hover:bg-zinc-900/40 hover:border-zinc-700 relative group/placeholder">
                                    
                                     {/* Uploading Spinner or content */}
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                                    ) : (
                                        <>
                                            <div className="absolute top-4 left-4 z-20">
                                                <Link 
                                                    href={backLink} 
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 text-white hover:bg-zinc-800 transition-all border border-white/10"
                                                    title={backLabel}
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                </Link>
                                            </div>
                                            <label className="flex flex-col items-center cursor-pointer group/label p-8">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-3 group-hover/label:bg-zinc-800 transition-all border border-white/5 shadow-inner">
                                                    <ImageIcon className="w-6 h-6 text-zinc-500 group-hover/label:text-zinc-200 transition-colors" />
                                                </div>
                                                <span className="text-sm font-semibold text-zinc-500 group-hover/label:text-zinc-300 transition-colors">Add Cover Image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                            </label>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Editable Title & Description - Tighter & Aligned */}
                        <div className="max-w-4xl space-y-2 px-1">
                            <input 
                                value={playbook.title}
                                onChange={onTitleChange}
                                placeholder="Untitled Playbook"
                                className="w-full bg-transparent text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight border-none focus:ring-0 placeholder:text-zinc-800 px-0 outline-none"
                            />
                            <textarea 
                                value={playbook.description || ''}
                                onChange={onDescriptionChange}
                                placeholder="Add a brief description..."
                                className="w-full bg-transparent text-lg md:text-xl text-zinc-400 font-medium leading-relaxed border-none focus:ring-0 placeholder:text-zinc-800 px-0 resize-none outline-none min-h-[40px]"
                                rows={1}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                            />
                        </div>

                    </div>
                ) : (
                    // ------------------ VIEW MODE HEADER ------------------
                    <div className="space-y-6 mb-16 animate-in fade-in duration-500">
                        {/* 1. View Banner */}
                        <div className="relative w-full rounded-3xl overflow-hidden h-[400px] mb-16 group border border-white/5 bg-zinc-900/50 shadow-2xl shadow-black/50 ring-1 ring-white/10">
                            <div className="absolute top-6 left-6 z-20">
                                <Link 
                                    href={backLink} 
                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-all border border-white/10 backdrop-blur-md group/back"
                                    title={backLabel}
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                            <div className="absolute inset-0 z-0">
                                {playbook.coverImage ? (
                                    <>
                                        <img src={playbook.coverImage} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20" /> 
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black" />
                                )}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                            </div>
                        </div>

                        {/* 2. View Title & Description */}
                        <div className="max-w-4xl space-y-6">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                                {playbook.title}
                            </h1>
                            {playbook.description && (
                                <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl leading-relaxed font-medium">
                                    {playbook.description}
                                </p>
                            )}
                        </div>
                    </div>
                )}


                {/* ==================================================================================
                    MAIN CONTENT GRID
                   ================================================================================== */}
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-10">
                    
                    {/* Left Column: TOC (Always Visible Now) */}
                    <div className="hidden lg:block lg:col-span-1">
                         <TableOfContents contentDependency={playbook} />
                    </div>

                    {/* Middle Column: Content */}
                    <div className="lg:col-span-3 space-y-16">
                         <div className={cn("min-h-[500px] prose prose-invert prose-lg max-w-none", isEditing && "max-w-4xl")}>
                            {children}
                        </div>

                        {/* Footer Widget: View Only */}
                        {!isEditing && (
                            <div className="pt-12 border-t border-white/5">
                                 <HelpfulWidget onCopyMarkdown={handleCopyMarkdown} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Metadata (View Only) */}
                    {!isEditing && (
                        <div className="lg:col-span-1 space-y-8 h-fit sticky top-32">
                            
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">Written by</h3>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-zinc-200">
                                        {playbook.createdBy?.name || playbook.createdBy?.email?.split('@')[0] || 'Team 1'}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 w-full" />

                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">On</h3>
                                <div className="text-sm font-medium text-zinc-200">
                                     {new Date(playbook.createdAt || playbook.updatedAt).toLocaleDateString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                     })}
                                </div>
                            </div>
 
                            <div className="h-px bg-white/5 w-full" />

                            {/* Read Time */}
                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">Read Time</h3>
                                <div className="text-sm font-medium text-zinc-200">
                                     {readTime || 'Less than 1 min'}
                                </div>
                            </div>

                            <div className="h-px bg-white/5 w-full" />

                            <div className="space-y-2">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-600">Need Help?</h3>
                                <a href="mailto:support@team1.india" className="flex items-center gap-2 text-sm font-medium text-white hover:text-zinc-300 transition-colors group">
                                    Reach out to the team <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>
                            
                            <div className="h-px bg-white/5 w-full" />

                            <div className="space-y-4">
                                {sidebarActions}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {!isEditing && <Footer />}
        </div>
    );
}
