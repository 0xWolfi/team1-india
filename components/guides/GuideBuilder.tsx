'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, GripVertical, CheckCircle2, Upload as UploadIcon, ImageIcon, X, Eye, Code } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { FormBuilder } from '../form-builder/FormBuilder';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

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
    
    // Markdown Content
    const [markdownContent, setMarkdownContent] = useState<string>(initialData?.body?.markdown || '');
    const [markdownViewMode, setMarkdownViewMode] = useState<'edit' | 'preview'>('edit');
    
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
            markdown: markdownContent
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

            {/* Markdown Content */}
            <section className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Content</h3>
                        <p className="text-xs text-zinc-500 mt-1">Write your content in Markdown format.</p>
                    </div>
                    <div className="flex gap-2 bg-zinc-800/50 border border-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setMarkdownViewMode('edit')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                                markdownViewMode === 'edit'
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Code className="w-3 h-3" /> Edit
                        </button>
                        <button
                            onClick={() => setMarkdownViewMode('preview')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                                markdownViewMode === 'preview'
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Eye className="w-3 h-3" /> Preview
                        </button>
                    </div>
                </div>
                
                {markdownViewMode === 'edit' ? (
                    <textarea
                        value={markdownContent}
                        onChange={(e) => {
                            setMarkdownContent(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="# Write your markdown content here...&#10;&#10;You can use:&#10;- Headers (# ## ###)&#10;- Lists (- or 1.)&#10;- **Bold** and *italic* text&#10;- Links and images&#10;- Code blocks&#10;- And more!"
                        className="w-full min-h-[400px] bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all font-mono text-sm leading-relaxed resize-none"
                        style={{ minHeight: '400px' }}
                    />
                ) : (
                    <div className="min-h-[400px] bg-zinc-900/50 border border-white/10 rounded-xl px-6 py-4 overflow-y-auto">
                        {markdownContent ? (
                            <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-blue-400 prose-strong:text-white prose-code:text-red-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-ul:text-zinc-300 prose-ol:text-zinc-300 prose-li:text-zinc-300">
                                <ReactMarkdown>{markdownContent}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                                No content yet. Switch to Edit mode to add markdown content.
                            </div>
                        )}
                    </div>
                )}
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
