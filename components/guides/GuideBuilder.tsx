'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, GripVertical, CheckCircle2, Upload as UploadIcon, ImageIcon, X } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { FormBuilder } from '../form-builder/FormBuilder';
import Image from 'next/image';

interface GuideBuilderProps {
    initialData?: any;
    type: 'EVENT' | 'PROGRAM' | 'CONTENT';
    onSave: (data: any) => Promise<void>;
    isSaving?: boolean;
}

export const GuideBuilder: React.FC<GuideBuilderProps> = ({ initialData, type, onSave, isSaving }) => {
    // Basic Info
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.body?.description || '');
    const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
    const [visibility, setVisibility] = useState<'CORE' | 'MEMBER' | 'PUBLIC'>(initialData?.visibility || 'CORE');
    
    // Dynamic Sections
    const [kpis, setKpis] = useState<{ label: string; value: string }[]>(initialData?.body?.kpis || []);
    const [timeline, setTimeline] = useState<{ step: string; duration: string }[]>(initialData?.body?.timeline || []);
    const [rules, setRules] = useState<string[]>(initialData?.body?.rules || []);
    
    // Default fields that are always present and cannot be removed
    const defaultFields = [
        { id: 'name', key: 'name', label: 'Name', type: 'text', required: true, isDefault: true, editable: true },
        { id: 'email', key: 'email', label: 'Email', type: 'email', required: true, isDefault: true, editable: false }
    ];

    // Form Builder (Rich Fields) - filter out default fields from initial data
    const [formFields, setFormFields] = useState<any[]>(() => {
        const initialFields = Array.isArray(initialData?.formSchema) 
            ? initialData.formSchema 
            : initialData?.formSchema 
                ? Object.entries(initialData.formSchema).map(([key, label]) => ({
                    id: key,
                    key,
                    label: label as string,
                    type: 'text',
                    required: true
                  }))
                : [];
        
        // Filter out any existing name/email fields from initial data (we'll use defaults)
        return initialFields.filter((f: any) => f.key !== 'name' && f.key !== 'email');
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = () => {
        const body = {
            description,
            kpis,
            timeline,
            rules
        };

        // Save the full rich field objects directly
        const formSchema = formFields;

        onSave({
            type,
            title,
            coverImage,
            visibility,
            body,
            formSchema
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        
        setIsUploading(true);
        const file = e.target.files[0];

        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload/token',
            });

            if (coverImage) {
               // Optional: Trigger delete of old image via API if needed
               // For now, we just replace the link
            }

            setCoverImage(newBlob.url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };



    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Basic Info */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Basic Information</h3>
                </div>
                
                {/* Cover Image */}
                <div>
                     <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">Cover Image</label>
                     <div className="relative group w-full h-64 bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-white/30 hover:bg-zinc-900/80 transition-all cursor-pointer">
                        {coverImage ? (
                            <>
                                <Image src={coverImage} alt="Cover" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                     <button 
                                        onClick={() => setCoverImage('')}
                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                     >
                                         <Trash2 className="w-4 h-4" /> Remove
                                     </button>
                                     <label className="px-4 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2 cursor-pointer">
                                        <UploadIcon className="w-4 h-4" /> Change
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                     </label>
                                </div>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-4 w-full h-full justify-center">
                                <div className="p-4 bg-zinc-800/50 rounded-full group-hover:bg-zinc-800 group-hover:scale-110 transition-all duration-300">
                                    {isUploading ? (
                                         <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300" />
                                    )}
                                </div>
                                <div className="text-center space-y-1">
                                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors block">
                                        {isUploading ? 'Uploading...' : 'Click to Upload Cover Image'}
                                    </span>
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors block">
                                        Recommended: 1200x600px • Max 5MB
                                    </span>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        )}
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Guide Title</label>
                        <input 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={`e.g., ${type === 'EVENT' ? 'Meetup' : type === 'PROGRAM' ? 'Mentorship' : 'Blog Post'} Guide`}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all shadow-inner shadow-black/20"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the purpose of this guide..."
                            rows={3}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all shadow-inner shadow-black/20 resize-none"
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Visibility</label>
                     <div className="flex gap-2">
                         {['CORE', 'MEMBER', 'PUBLIC'].map(tag => (
                             <button
                                key={tag}
                                onClick={() => setVisibility(tag as any)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                    visibility === tag 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
                                }`}
                             >
                                 {tag}
                             </button>
                         ))}
                     </div>
                     <p className="text-[10px] text-zinc-500 mt-2 ml-1">
                        {visibility === 'CORE' && "Visible only to core team members."}
                        {visibility === 'MEMBER' && "Visible to all registered members."}
                        {visibility === 'PUBLIC' && "Publicly accessible to everyone."}
                     </p>
                </div>
            </section>

                <div className="h-px bg-white/5 my-8" />

            {/* KPIs */}
            <section className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Success Metrics (KPIs)</h3>
                         <p className="text-xs text-zinc-500 mt-1">Define key performance indicators for this initiative.</p>
                    </div>
                    <button 
                        onClick={() => setKpis([...kpis, { label: '', value: '' }])}
                        className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-white/5"
                    >
                        <Plus className="w-3 h-3" /> Add KPI
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kpis.map((kpi, idx) => (
                        <div key={idx} className="flex gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-600 px-1">Label</label>
                                <input 
                                    value={kpi.label} onChange={e => { const n = [...kpis]; n[idx].label = e.target.value; setKpis(n); }}
                                    placeholder="e.g. Attendance"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-600 px-1">Target</label>
                                <input 
                                    value={kpi.value} onChange={e => { const n = [...kpis]; n[idx].value = e.target.value; setKpis(n); }}
                                    placeholder="e.g. 50+"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <button onClick={() => setKpis(kpis.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-white hover:bg-zinc-800 p-2 rounded-lg self-end mb-0.5 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {kpis.length === 0 && (
                        <div className="col-span-full py-8 text-center text-zinc-600 bg-white/[0.02] rounded-xl border border-dashed border-white/5">
                            No KPIs added yet.
                        </div>
                    )}
                </div>
            </section>

            {/* Timeline */}
            <section className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Approval Timeline</h3>
                        <p className="text-xs text-zinc-500 mt-1">Set the expected duration for each step of the process.</p>
                    </div>
                    <button 
                        onClick={() => setTimeline([...timeline, { step: '', duration: '' }])}
                        className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-white/5"
                    >
                        <Plus className="w-3 h-3" /> Add Step
                    </button>
                </div>
                <div className="space-y-3">
                    {timeline.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-white/5 shrink-0 ml-1">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <input 
                                    value={item.step} onChange={e => { const n = [...timeline]; n[idx].step = e.target.value; setTimeline(n); }}
                                    placeholder="Step Name (e.g. Initial Review)"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="w-32">
                                <input 
                                    value={item.duration} onChange={e => { const n = [...timeline]; n[idx].duration = e.target.value; setTimeline(n); }}
                                    placeholder="Duration"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <button onClick={() => setTimeline(timeline.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-white hover:bg-zinc-800 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {timeline.length === 0 && (
                        <div className="py-8 text-center text-zinc-600 bg-white/[0.02] rounded-xl border border-dashed border-white/5">
                            No timeline steps defined.
                        </div>
                    )}
                </div>
            </section>
            
            <div className="h-px bg-white/5 my-8" />

            {/* Rules */}
            <section className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Guidelines & Rules</h3>
                        <p className="text-xs text-zinc-500 mt-1">Important rules users must follow.</p>
                    </div>
                    <button 
                        onClick={() => setRules([...rules, ''])}
                        className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-white/5"
                    >
                        <Plus className="w-3 h-3" /> Add Rule
                    </button>
                </div>
                <div className="space-y-3">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="flex gap-3 bg-black/20 p-2 rounded-xl border border-white/5 items-center">
                             <div className="pl-3 pr-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                             </div>
                             <input 
                                value={rule} onChange={e => { const n = [...rules]; n[idx] = e.target.value; setRules(n); }}
                                placeholder="Rule description..."
                                className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-white/20"
                            />
                             <button onClick={() => setRules(rules.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-white hover:bg-zinc-800 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                     {rules.length === 0 && (
                        <div className="py-8 text-center text-zinc-600 bg-white/[0.02] rounded-xl border border-dashed border-white/5">
                            No rules defined.
                        </div>
                     )}
                </div>
            </section>

             <div className="h-px bg-white/5" />

            {/* Form Builder */}
            <section className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6">
                 <div className="mb-6 p-4 bg-zinc-800/30 border border-white/10 rounded-xl flex items-start gap-3">
                    <div className="text-zinc-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Default Fields</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                            Applicant <strong>Name</strong> and <strong>Email</strong> are collected automatically from their login session. 
                            You do not need to add these fields below.
                        </p>
                    </div>
                 </div>
                 {/* Show default fields first, then custom fields */}
                 <FormBuilder fields={[...defaultFields, ...formFields]} onChange={(newFields) => {
                     // Filter out default fields from the onChange callback
                     const customFields = newFields.filter((f: any) => !f.isDefault && f.key !== 'name' && f.key !== 'email');
                     setFormFields(customFields);
                 }} />
            </section>

            {/* Actions */}
            <div className="sticky bottom-6 flex justify-end">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving || !title}
                    className="bg-white text-black font-bold text-sm px-8 py-3 rounded-xl shadow-xl shadow-black/50 hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Save Guide
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
