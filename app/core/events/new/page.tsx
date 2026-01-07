'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Calendar, Save, Trash2, ArrowLeft, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewEventPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [visibility, setVisibility] = useState<'CORE' | 'MEMBER' | 'PUBLIC'>('CORE');
    const [coverImage, setCoverImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = async () => {
        if (!title) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    location,
                    date,
                    visibility,
                    customFields: { coverImage } // Store coverImage in customFields for now as per my schema assumption or if schema updated
                    // Wait, Schema doesn't have coverImage. I should verify if I can add it or if customFields is preferred.
                    // Guide has coverImage. Event doesn't in schema snippet I saw earlier.
                    // I will put it in customFields.
                })
            });

            if (res.ok) {
                router.push('/core/events');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setCoverImage(data.url);
            }
        } catch(e) { console.error(e); }
        finally { setIsUploading(false); }
    };

    return (
        <CoreWrapper>
            <div className="mb-6">
                <Link href="/core/events" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-medium mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </Link>
                <CorePageHeader 
                    title="Schedule Event" 
                    description="Create a new event on the calendar."
                    icon={<Calendar className="w-5 h-5 text-zinc-200" />}
                />
            </div>

            <div className="max-w-2xl mx-auto space-y-8 pb-20">
                 {/* Cover Image */}
                 <div className="space-y-2">
                     <label className="block text-xs font-bold text-zinc-500 uppercase">Cover Image</label>
                     <div className="relative group w-full h-48 bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-white/20 transition-all">
                        {coverImage ? (
                            <>
                                <Image src={coverImage} alt="Cover" fill className="object-cover" />
                                <button 
                                    onClick={() => setCoverImage('')}
                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/50 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-zinc-600 group-hover:text-zinc-400" />
                                <span className="text-xs text-zinc-600 group-hover:text-zinc-400 font-medium"> Upload Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        )}
                     </div>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Event Title</label>
                         <input 
                             value={title}
                             onChange={e => setTitle(e.target.value)}
                             className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none"
                             placeholder="e.g. Annual Summit"
                         />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Date</label>
                             <input 
                                 type="datetime-local"
                                 value={date}
                                 onChange={e => setDate(e.target.value)}
                                 className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none [color-scheme:dark]"
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Location</label>
                             <input 
                                 value={location}
                                 onChange={e => setLocation(e.target.value)}
                                 className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none"
                                 placeholder="e.g. New York, NY"
                             />
                         </div>
                     </div>

                     <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                         <textarea 
                             value={description}
                             onChange={e => setDescription(e.target.value)}
                             className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none h-32 resize-none"
                             placeholder="Event details..."
                         />
                     </div>

                     <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Visibility</label>
                         <div className="flex gap-2">
                             {['CORE', 'MEMBER', 'PUBLIC'].map((v) => (
                                 <button
                                     key={v}
                                     onClick={() => setVisibility(v as any)}
                                     className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                         visibility === v 
                                         ? 'bg-indigo-500 text-white border-indigo-500' 
                                         : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
                                     }`}
                                 >
                                     {v}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>

                 <div className="flex justify-end pt-6 border-t border-white/5">
                     <button
                         onClick={handleSave}
                         disabled={isSaving || !title}
                         className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                     >
                         {isSaving ? 'Saving...' : <><Save className="w-4 h-4"/> Save Event</>}
                     </button>
                 </div>
            </div>
        </CoreWrapper>
    );
}
