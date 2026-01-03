'use client';

import React from 'react';
import { Plus, Trash2, GripVertical, Settings, Type, AlignLeft, Hash, Calendar, List, CheckSquare, Link as LinkIcon, Mail, Phone } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'url' | 'tel';

export interface FormField {
    id: string; // Unique identifier for the field
    key: string; // The data key (e.g., 'eventDate')
    label: string;
    type: FieldType;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select inputs
}

interface FormBuilderProps {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Short Text', icon: <Type className="w-4 h-4" /> },
    { type: 'textarea', label: 'Long Text', icon: <AlignLeft className="w-4 h-4" /> },
    { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { type: 'tel', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
    { type: 'url', label: 'Link', icon: <LinkIcon className="w-4 h-4" /> },
    { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
    { type: 'select', label: 'Select', icon: <List className="w-4 h-4" /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onChange }) => {
    
    const addField = (type: FieldType) => {
        const newField: FormField = {
            id: crypto.randomUUID(),
            key: `question_${Date.now()}`, // Fallback unique ID
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type,
            required: true,
            placeholder: ''
        };
        onChange([...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        onChange(newFields);
    };

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8">
            {/* Field Palette (Tile Input) */}
            <div>
                 <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Application Form Builder</h3>
                    <p className="text-xs text-zinc-500 mt-1">Click a tile below to add a field to your form.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {FIELD_TYPES.map((ft) => (
                        <button
                            key={ft.type}
                            onClick={() => addField(ft.type)}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/50 border border-white/5 rounded-xl hover:bg-zinc-800 hover:border-white/20 transition-all group"
                        >
                            <div className="p-2 rounded-full bg-white/5 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors text-zinc-400">
                                {ft.icon}
                            </div>
                            <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{ft.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Field List */}
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="group relative bg-zinc-900/60 border border-white/5 rounded-xl p-4 transition-all hover:bg-zinc-900 hover:border-white/10">
                        <div className="flex gap-4 items-start">
                            {/* Drag Handle */}
                            <div className="mt-3 text-zinc-700 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Label & Key */}
                                <div className="md:col-span-4 space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-2">
                                            Question Label
                                        </label>
                                        <input 
                                            value={field.label}
                                            onChange={(e) => {
                                                const newLabel = e.target.value;
                                                const slug = newLabel.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                                                updateField(index, { 
                                                    label: newLabel,
                                                    key: slug || field.id // Fallback to ID if slug is empty to ensure uniqueness
                                                });
                                            }}
                                            placeholder="e.g. What is your experience?"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        />
                                        <p className="text-[9px] text-zinc-600 mt-1">The actual question the applicant will see.</p>
                                    </div>
                                    {/* Data Key is now auto-generated and hidden from the user */}
                                </div>

                                {/* Configuration */}
                                <div className="md:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Input Type</label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-zinc-400 cursor-not-allowed">
                                            {FIELD_TYPES.find(f => f.type === field.type)?.icon}
                                            <span>{FIELD_TYPES.find(f => f.type === field.type)?.label}</span>
                                        </div>
                                    </div>

                                    {/* Select Options */}
                                    {field.type === 'select' && (
                                        <div className="col-span-2">
                                             <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Options (comma separated)</label>
                                             <input 
                                                value={field.options?.join(', ') || ''}
                                                onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                placeholder="Option 1, Option 2, Option 3"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                    )}

                                    <div className="col-span-2 flex items-center gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer group/check">
                                            <input 
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                                className="w-4 h-4 rounded bg-black/40 border-white/10 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs text-zinc-400 group-hover/check:text-white transition-colors">Required Field</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="md:col-span-1 flex justify-end">
                                    <button 
                                        onClick={() => removeField(index)}
                                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors h-fit"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {fields.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <Settings className="w-5 h-5 text-zinc-500" />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">No fields added yet</p>
                        <p className="text-zinc-600 text-xs mt-1">Select a field type from above to start building.</p>
                     </div>
                )}
            </div>
        </div>
    );
};
