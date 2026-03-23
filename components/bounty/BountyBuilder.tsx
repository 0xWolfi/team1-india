'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { FormBuilder } from '../form-builder/FormBuilder';
import ReactMarkdown from 'react-markdown';
import { Check, Code, Eye } from "lucide-react";
interface BountyBuilderProps {
    initialData?: any;
    onSave: (data: any) => Promise<void>;
    isSaving?: boolean;
}

const typeOptions = [
    { value: "tweet", label: "Tweet" },
    { value: "thread", label: "Thread" },
    { value: "blog", label: "Blog" },
    { value: "video", label: "Video" },
    { value: "developer", label: "Developer" },
];

const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "twice-weekly", label: "Twice a week" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Biweekly" },
];

const audienceOptions = [
    { value: "member", label: "Member" },
    { value: "public", label: "Public" },
];

export const BountyBuilder: React.FC<BountyBuilderProps> = ({ initialData, onSave, isSaving }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [type, setType] = useState(initialData?.type || 'tweet');
    const [xpReward, setXpReward] = useState<number>(initialData?.xpReward || 10);
    const [frequency, setFrequency] = useState(initialData?.frequency || 'weekly');
    const [audience, setAudience] = useState(initialData?.audience || 'member');
    const [deadline, setDeadline] = useState(initialData?.deadline || '');

    // Markdown instructions
    const [markdownContent, setMarkdownContent] = useState<string>(initialData?.body?.markdown || '');
    const [markdownViewMode, setMarkdownViewMode] = useState<'edit' | 'preview'>('edit');

    // Form Builder for custom submission fields
    const defaultFields = [
        { id: 'proofUrl', key: 'proofUrl', label: 'Proof URL', type: 'url', required: true, isDefault: true, editable: false },
    ];

    const [formFields, setFormFields] = useState<any[]>(() => {
        const initialFields = Array.isArray(initialData?.formSchema) ? initialData.formSchema : [];
        return initialFields.filter((f: any) => f.key !== 'proofUrl');
    });

    const handleSave = () => {
        onSave({
            title,
            description,
            type,
            xpReward: Number(xpReward),
            frequency,
            audience,
            deadline: deadline || undefined,
            body: { markdown: markdownContent },
            formSchema: formFields,
        });
    };

    const inputClass = "w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all text-sm";

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Basic Info */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold text-white">Bounty Details</h3>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Title *</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Write a tweet about Avalanche L1s"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Brief description of what the bounty requires..."
                        rows={3}
                        className={`${inputClass} resize-none`}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Type *</label>
                        <div className="flex flex-wrap gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setType(opt.value)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                        type === opt.value
                                            ? 'bg-white text-black border-white'
                                            : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Frequency *</label>
                        <div className="flex flex-wrap gap-2">
                            {frequencyOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFrequency(opt.value)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                        frequency === opt.value
                                            ? 'bg-white text-black border-white'
                                            : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Audience *</label>
                    <div className="flex flex-wrap gap-2">
                        {audienceOptions.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAudience(opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                    audience === opt.value
                                        ? 'bg-white text-black border-white'
                                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:bg-zinc-800'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-1.5">
                        {audience === 'member' ? 'Only platform members can participate' : 'Only public users can participate'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">XP Reward *</label>
                        <input
                            type="number"
                            value={xpReward}
                            onChange={e => setXpReward(Number(e.target.value))}
                            min={1}
                            max={1000}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Deadline (optional)</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            </section>

            <div className="h-px bg-white/5 my-8" />

            {/* Markdown Instructions */}
            <section className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Instructions</h3>
                        <p className="text-xs text-zinc-500 mt-1">Write detailed instructions for this bounty in Markdown.</p>
                    </div>
                    <div className="flex gap-2 bg-zinc-800/50 border border-white/10 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setMarkdownViewMode('edit')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                                markdownViewMode === 'edit'
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Code className="w-3 h-3"/> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setMarkdownViewMode('preview')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                                markdownViewMode === 'preview'
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Eye className="w-3 h-3"/> Preview
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
                        placeholder={"# Bounty Instructions\n\n## Requirements\n- Step 1\n- Step 2\n\n## Submission Guidelines\nDescribe what proof is needed..."}
                        className="w-full min-h-[300px] bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all font-mono text-sm leading-relaxed resize-none"
                        style={{ minHeight: '300px' }}
                    />
                ) : (
                    <div className="min-h-[300px] bg-zinc-900/50 border border-white/10 rounded-xl px-6 py-4 overflow-y-auto">
                        {markdownContent ? (
                            <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-blue-400 prose-strong:text-white prose-code:text-red-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-ul:text-zinc-300 prose-ol:text-zinc-300 prose-li:text-zinc-300">
                                <ReactMarkdown>{markdownContent}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                                No instructions yet. Switch to Edit mode to write markdown.
                            </div>
                        )}
                    </div>
                )}
            </section>

            <div className="h-px bg-white/5" />

            {/* Form Builder for custom submission fields */}
            <section className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6">
                <div className="mb-6 p-4 bg-zinc-800/30 border border-white/10 rounded-xl flex items-start gap-3">
                    <Check className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5"/>
                    <div>
                        <h4 className="text-sm font-bold text-white">Submission Fields</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                            <strong>Proof URL</strong> is collected by default. Add any extra fields members should fill when submitting.
                        </p>
                    </div>
                </div>
                <FormBuilder fields={[...defaultFields, ...formFields]} onChange={(newFields) => {
                    const customFields = newFields.filter((f: any) => !f.isDefault && f.key !== 'proofUrl');
                    setFormFields(customFields);
                }} />
            </section>

            {/* Save */}
            <div className="sticky bottom-6 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !title}
                    className="bg-white text-black font-bold text-sm px-8 py-3 rounded-xl shadow-xl shadow-black/50 hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? 'Creating...' : <><Save className="w-4 h-4" /> Create Bounty</>}
                </button>
            </div>
        </div>
    );
};
