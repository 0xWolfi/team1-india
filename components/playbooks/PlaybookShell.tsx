"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, X, Image as ImageIcon, Loader2, Copy, Check } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { HelpfulWidget } from "./HelpfulWidget";
import { Footer } from "@/components/website/Footer";
import { cn } from "@/lib/utils";
import { TableOfContents } from "./TableOfContents";
import { ImageCropper } from "../ui/ImageCropper";
import { motion, useScroll, useSpring, AnimatePresence, useMotionValueEvent } from "framer-motion"; // Animation hooks

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
    stickyActions?: React.ReactNode;
    className?: string; 
    contentClassName?: string;
    isEditing?: boolean;
    onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDescriptionChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onCoverImageChange?: (url: string | undefined) => void;

}

export function PlaybookShell({ 
    playbook, 
    backLink, 
    backLabel = "Back to Dashboard", 
    children, 
    sidebarActions, 
    headerActions,
    stickyActions,
    className,
    contentClassName,
    isEditing = false,
    onTitleChange,
    onDescriptionChange,
    onCoverImageChange,
}: PlaybookShellProps) {

    // Cropper & Upload States
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Premium UI States (Scroll & Sticky)
    const { scrollYProgress, scrollY } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const [showStickyHeader, setShowStickyHeader] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 400 && !showStickyHeader) setShowStickyHeader(true);
        if (latest <= 400 && showStickyHeader) setShowStickyHeader(false);
    });

    const handleCopyMarkdown = () => {
        if (!playbook.body) return;
        
        let contentToCopy = "";
        try {
             // Best effort: Copy title + description + body representation
             contentToCopy = `# ${playbook.title}\n\n${playbook.description || ''}\n\n`;
             const bodyStr = typeof playbook.body === 'string' ? playbook.body : JSON.stringify(playbook.body);
             contentToCopy += bodyStr; 
        } catch (e) {
            contentToCopy = "Error copying content.";
        }
        
        
        navigator.clipboard.writeText(contentToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

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
            const newBlob = await upload('cover.jpg', croppedBlob, {
                access: 'public',
                handleUploadUrl: '/api/upload/token',
            });
            onCoverImageChange(newBlob.url);
        } catch (err) {
            console.error(err);
            alert("Upload error");
        } finally {
            setIsUploading(false);
        }
    };



    return (
        <div className={cn("min-h-screen text-white selection:bg-purple-500/30 font-sans", className)}>
            
            {/* 1. Reading Progress Bar (View Mode Only) */}
            {!isEditing && (
                <motion.div 
                    className="fixed top-0 left-0 right-0 h-1 bg-white origin-left z-[100]" 
                    style={{ scaleX }} 
                />
            )}

            {/* 2. Sticky Context Header (View Mode Only) - Floating Pill */}
            <AnimatePresence>
                {!isEditing && (

                    <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-4 left-4 w-auto max-w-4xl bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 z-50 flex items-center justify-between py-2 pl-2 pr-4 shadow-2xl gap-6 ring-1 ring-white/5"
                    >
                         <div className="flex items-center gap-3">
                            {backLink.startsWith('/core') && (
                                <>
                                    <Link 
                                        href={backLink} 
                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-white/5"
                                        title={backLabel}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Link>
                                    <span className="w-px h-4 bg-white/10" />
                                </>
                            )}
                            {/* Title Removed: <h3 className="font-medium text-zinc-200 text-sm line-clamp-1 max-w-[200px] md:max-w-xs">{playbook.title}</h3> */}
                            {stickyActions && (
                                <>
                                    <span className="w-px h-4 bg-white/10" />
                                    {stickyActions}
                                </>
                            )}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Cropper Modal */}
            {cropperSrc && (
                <ImageCropper 
                    imageSrc={cropperSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropperSrc(null)}
                    aspectRatio={2.4} 
                />
            )}

            {/* Top Navigation Bar: Actions Only (Save/Cancel/Back) - VISIBLE ONLY IN EDIT MODE */}
            <div className="fixed top-0 w-full z-50 px-6 h-16 flex items-center justify-between pointer-events-none">
                 <div /> {/* Spacer */}
                 {isEditing && headerActions && (
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
                    // ------------------ VIEW MODE HEADER ------------------
                    // ------------------ VIEW MODE HEADER (BLOG STYLE) ------------------
                    // ------------------ VIEW MODE HEADER (HERO STYLE) ------------------
                    // ------------------ VIEW MODE HEADER (HERO STYLE) ------------------
                    <div className="max-w-5xl mx-auto space-y-8 mb-16 animate-in fade-in duration-500 pt-0">
                        
                         {/* 1. Feature Image (Top - No Padding above) */}
                        {playbook.coverImage && (
                            <div className="relative w-full rounded-2xl overflow-hidden aspect-[2.4/1] bg-zinc-900 shadow-2xl group mb-8">
                                <img src={playbook.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                
                                {/* Back Button Inside Banner */}
                                <div className="absolute top-4 left-4 z-20">
                                    <Link 
                                        href={backLink} 
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10"
                                        title={backLabel}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {!playbook.coverImage && (
                             <div className="mb-8 pt-8">
                                 <Link 
                                    href={backLink} 
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                                    title={backLabel}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Link>
                             </div>
                        )}

                        {/* 2. Title & Description */}
                        <div className="space-y-6 text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
                                {playbook.title}
                            </h1>
                            {playbook.description && (
                                <p className="text-xl text-zinc-400 leading-relaxed font-medium w-full">
                                    {playbook.description}
                                </p>
                            )}
                        </div>

                        {/* Divider before Body */}
                        <div className="w-full h-px bg-white/10 my-8" />
                    </div>
                )}

                {/* ==================================================================================
                    MAIN CONTENT AREA
                   ================================================================================== */}
                
                {isEditing ? (
                    // ------------------ EDIT MODE (GRID LAYOUT) ------------------
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-10">
                        {/* Left Column: TOC */}
                        <div className="hidden lg:block lg:col-span-1">
                             <TableOfContents contentDependency={playbook} />
                        </div>

                        {/* Middle Column: Content */}
                        <div className="lg:col-span-3 space-y-16">
                             <div className="min-h-[500px] prose prose-invert prose-lg max-w-none max-w-4xl">
                                {children}
                            </div>
                        </div>

                        {/* Right Column: Metadata (Edit Mode Only - likely empty or actions) */}
                        <div className="lg:col-span-1 space-y-8 h-fit sticky top-32">
                             <div className="space-y-4">
                                {sidebarActions}
                            </div>
                        </div>
                    </div>
                ) : (
                    // ------------------ VIEW MODE (SINGLE COLUMN READER) ------------------
                    <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* 3. Floating Table of Contents (Desktop Only) */}
                        <div className="hidden xl:block fixed right-8 top-32 w-64 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
                             <div className="pl-6 border-l border-white/5">
                                <TableOfContents contentDependency={playbook} />
                             </div>
                        </div>
                        
                        {/* Content */}
                        <div className="min-h-[200px] prose prose-invert prose-lg max-w-none leading-relaxed">
                            {children}
                        </div>

                        {/* Reader Footer */}
                        <div className="mt-16 space-y-8">
                             
                             {/* Divider after Body */}
                             <div className="w-full h-px bg-white/10" />

                             {/* 1. Share or Remix (Plain Text style) */}
                             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-white/5">
                                <div className="space-y-0.5">
                                    <h3 className="text-sm font-semibold text-white">Share or Remix</h3>
                                    <p className="text-xs text-zinc-400">Copy the markdown source for this playbook.</p>
                                </div>
                                <button 
                                    onClick={handleCopyMarkdown}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-all"
                                >
                                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    {isCopied ? <span className="text-emerald-400">Copied!</span> : "Copy Markdown"}
                                </button>
                             </div>

                             {/* 2. Metadata (Left: By, Right: On) */}
                             <div className="flex items-center justify-between text-sm py-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                     <span className="text-zinc-500 font-medium">Written by</span>
                                     <span className="text-zinc-200 font-semibold px-2 py-1 bg-zinc-800 rounded text-xs tracking-wide">
                                        {(playbook.createdBy?.name || playbook.createdBy?.email || 'TEAM 1').toUpperCase()}
                                     </span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-zinc-500 font-medium">On</span>
                                     <span className="text-zinc-300 font-medium">
                                        {new Date(playbook.createdAt || playbook.updatedAt).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                     </span>
                                </div>
                             </div>

                             {/* 3. Feedback & Support Row */}
                             <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                                {/* Left: Feedback */}
                                <HelpfulWidget />

                                {/* Right: Support */}
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-zinc-500">Need changes?</span>
                                    <a href="mailto:support@team1.india" className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors group">
                                       Reach out <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </div>
                             </div>

                        </div>
                    </div>
                )}
            </div>



            
            {!isEditing && <Footer />}
        </div>
    );
}
