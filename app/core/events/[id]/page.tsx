'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Calendar, Save, Trash2, ArrowLeft, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [event, setEvent] = useState<any>(null); // Full event object
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [visibility, setVisibility] = useState<'CORE' | 'MEMBER' | 'PUBLIC'>('CORE');
    const [coverImage, setCoverImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if(!id) return;
        fetch(`/api/events/${id}`)
            .then(res => {
                if(res.ok) return res.json();
                throw new Error("Not found");
            })
            .then(data => {
                setEvent(data);
                setTitle(data.title);
                setDescription(data.description || '');
                setLocation(data.location || '');
                setDate(data.date || '');
                setVisibility(data.visibility || 'CORE');
                setCoverImage(data.customFields?.coverImage || '');
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                router.push('/core/events');
            });
    }, [id, router]);

    const handleSave = async () => {
        if (!title) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    location,
                    date,
                    visibility,
                    customFields: { coverImage } 
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
    
    const handleDelete = async () => {
        if(!confirm("Delete this event?")) return;
        try {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
            if(res.ok) router.push('/core/events');
        } catch(e) { console.error(e); }
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
    
    if (isLoading) return <div className="text-center pt-24 text-zinc-500">Loading...</div>;

    return (
        <CoreWrapper>
            <div className="mb-6 flex items-center justify-between">
                <div>
                     <Link href="/core/events" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-medium mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to List
                    </Link>
                    <CorePageHeader 
                        title="Edit Event" 
                        description={`Managing: ${title}`}
                        icon={<Calendar className="w-5 h-5 text-zinc-200" />}
                    />
                </div>
                <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                    <Trash2 className="w-4 h-4" /> Delete
                </button>
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
                                 value={date ? new Date(date).toISOString().slice(0, 16) : ''}
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
                         {isSaving ? 'Saving...' : <><Save className="w-4 h-4"/> Save Changes</>}
                     </button>
                 </div>
            </div>
        </CoreWrapper>
    );
}
