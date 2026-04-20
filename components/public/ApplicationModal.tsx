'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useSession } from 'next-auth/react';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApplicationModal({ isOpen, onClose }: ApplicationModalProps) {
    const { data: session } = useSession();
    const [step, setStep] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        telegram: '',
        xHandle: '',
        about: '',
        resumeLink: '',
        skills: '',
        country: '',
        
        // Questions
        q_whyJoin: '',
        q_howHelp: '',
        q_weeklyHours: '',
        q_expectations: '',
        
        // Optional
        github: '',
        otherLink: '',
        referredBy: '',
        
        consent: false,
        
        // Extended Location
        state: ''
    });

    const [skillInput, setSkillInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [fieldErrors, setFieldErrors] = useState<{ telegram?: string; xHandle?: string }>({});

    // Sync tags to formData
    useEffect(() => {
        setFormData(prev => ({ ...prev, skills: tags.join(', ') }));
    }, [tags]);

    // Handle Validation
    const validateHandle = (name: string, value: string) => {
        if (value.includes('@')) return "Do not include '@' symbol.";
        if (/[^a-zA-Z0-9_.]/.test(value)) return "Only letters, numbers, underscores, and dots allowed.";
        return undefined;
    };

    // Fetch user name and email from database when modal opens and user is logged in
    useEffect(() => {
        if (isOpen && session?.user?.email) {
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.name || data.email) {
                        setFormData(prev => ({
                            ...prev,
                            name: data.name || prev.name || session.user?.name || '',
                            email: data.email || prev.email || session.user?.email || ''
                        }));
                    }
                })
                .catch(err => {
                    console.error("Error fetching user profile:", err);
                    // Fallback to session data
                    setFormData(prev => ({
                        ...prev,
                        name: session.user?.name || prev.name,
                        email: session.user?.email || prev.email
                    }));
                });
        }
    }, [isOpen, session]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Handle Validation logic
        if (name === 'telegram' || name === 'xHandle') {
            const error = validateHandle(name, value);
            setFieldErrors(prev => ({ ...prev, [name]: error }));
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            const val = skillInput.trim().replace(/,/g, '');
            if (val && !tags.includes(val)) {
                setTags(prev => [...prev, val]);
                setSkillInput("");
            }
        } else if (e.key === 'Backspace' && !skillInput && tags.length > 0) {
            setTags(prev => prev.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('submitting');
        setError('');

        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guideId: null, // General membership application (no specific program/event)
                    data: formData
                })
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.error || responseData.message || 'Failed to submit application');
            }
            
            setStep('success');
            // Reset form after delay or on close?
        } catch (err: any) {
            console.error(err);
            setStep('error');
            setError(err.message || 'Something went wrong. Please try again.');
        }
    };

    const reset = () => {
        setStep('form');
        setFormData({
            name: '', email: '', telegram: '', xHandle: '', about: '', resumeLink: '', skills: '', country: 'India', state: '',
            q_whyJoin: '', q_howHelp: '', q_weeklyHours: '', q_expectations: '',
            github: '', otherLink: '', referredBy: '', consent: false
        });
        setTags([]);
        setSkillInput('');
        setFieldErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={reset} title="Apply for Membership">
            {step === 'success' ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle className="w-8 h-8"/>
                    </div>
                    <h3 className="text-2xl font-bold text-black dark:text-white">Application Submitted!</h3>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Thank you for volunteering. The Core team will review your application and reach out via Telegram or Email.
                    </p>
                    <button onClick={reset} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors mt-4">
                        Close
                    </button>
                </div>
            ) : step === 'error' ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <AlertCircle className="w-8 h-8"/>
                    </div>
                    <h3 className="text-2xl font-bold text-black dark:text-white">Submission Failed</h3>
                    <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
                    <div className="flex gap-4">
                        <button onClick={reset} className="px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                            Cancel
                        </button>
                        <button onClick={() => setStep('form')} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                            Try Again
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personals */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Full Name *</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        name="name" 
                                        value={formData.name} 
                                        readOnly
                                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-zinc-500 dark:text-zinc-400 cursor-not-allowed focus:outline-none" 
                                        placeholder="John Doe" 
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-600 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded border border-black/5 dark:border-white/5">
                                        Verified
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 ml-1">Name is auto-filled from your account.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email *</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        readOnly
                                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-zinc-500 dark:text-zinc-400 cursor-not-allowed focus:outline-none" 
                                        placeholder="john@example.com" 
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-600 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded border border-black/5 dark:border-white/5">
                                        Verified
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 ml-1">Email is auto-filled from your account.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Telegram Handle *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                                    <input 
                                        required 
                                        name="telegram" 
                                        value={formData.telegram} 
                                        onChange={handleChange} 
                                        className={`w-full bg-white/5 border ${fieldErrors.telegram ? 'border-red-500' : 'border-black/10 dark:border-white/10'} rounded-lg pl-7 pr-3 py-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900`} 
                                        placeholder="username" 
                                    />
                                    {fieldErrors.telegram && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.telegram}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">X Handle (Twitter) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                                    <input 
                                        required 
                                        name="xHandle" 
                                        value={formData.xHandle} 
                                        onChange={handleChange} 
                                        className={`w-full bg-white/5 border ${fieldErrors.xHandle ? 'border-red-500' : 'border-black/10 dark:border-white/10'} rounded-lg pl-7 pr-3 py-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900`} 
                                        placeholder="username" 
                                    />
                                    {fieldErrors.xHandle && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.xHandle}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Country *</label>
                                <select 
                                    required 
                                    name="country" 
                                    value={formData.country} 
                                    onChange={handleChange} 
                                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900 appearance-none"
                                >
                                    <option value="India">India</option>
                                    {/* Future: Add more via API */}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">State / Province *</label>
                                <select 
                                    required 
                                    name="state" 
                                    value={formData.state} 
                                    onChange={handleChange} 
                                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900 appearance-none"
                                >
                                    <option value="" disabled>Select State</option>
                                    {INDIAN_STATES.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Check-ins */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2">Experience & Skills</h4>
                         <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Short Bio / About You *</label>
                            <textarea required name="about" value={formData.about} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900 h-24" placeholder="Tell us a bit about yourself..." />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Resume / Portfolio Link *</label>
                                <input required type="url" name="resumeLink" value={formData.resumeLink} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900" placeholder="https://" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Top Skills (Type and press comma) *</label>
                                <div className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 flex flex-wrap gap-2 min-h-[50px] focus-within:bg-zinc-100 dark:focus-within:bg-zinc-900 focus-within:border-black/50 dark:focus-within:border-white/50 transition-all">
                                    {tags.map(tag => (
                                        <span key={tag} className="bg-black/10 dark:bg-white/10 text-black dark:text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white"><XCircle className="w-3 h-3"/></button>
                                        </span>
                                    ))}
                                    <input
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleSkillKeyDown}
                                        className="bg-transparent border-none outline-none text-black dark:text-white text-sm flex-1 min-w-[100px]" 
                                        placeholder="React, Design..."
                                    />
                                </div>
                                <input type="hidden" name="skills" value={formData.skills} />
                            </div>
                         </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2">Community Fit</h4>
                        
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Why do you want to be a member? *</label>
                            <textarea required name="q_whyJoin" value={formData.q_whyJoin} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900 h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">How can you help Team1? *</label>
                            <textarea required name="q_howHelp" value={formData.q_howHelp} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900 h-20" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">What are you expecting from us? *</label>
                            <textarea required name="q_expectations" value={formData.q_expectations} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900 h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Hours available weekly? (Numbers only) *</label>
                            <input 
                                required 
                                type="number" 
                                min="0"
                                name="q_weeklyHours" 
                                value={formData.q_weeklyHours} 
                                onChange={handleChange} 
                                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900" 
                                placeholder="e.g. 10" 
                            />
                        </div>
                    </div>

                    {/* Optional / Meta */}
                    <div className="space-y-4">
                         <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-2">Additional Info</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">GitHub (Optional)</label>
                                <input name="github" value={formData.github} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900" placeholder="github.com/username" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Referred By (Optional)</label>
                                <input name="referredBy" value={formData.referredBy} onChange={handleChange} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-black/50 dark:focus:border-white/50 transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-900" />
                            </div>
                         </div>
                    </div>

                    {/* Consent */}
                    <div className="pt-4 border-t border-black/5 dark:border-white/5">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input required type="checkbox" name="consent" checked={formData.consent} onChange={handleCheckbox} className="mt-1 w-4 h-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 focus:ring-emerald-500" />
                            <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                                I understand that this is a <strong>volunteer opportunity</strong>. There is no monetary compensation for membership, but as a member, I may earn bounties or grants for specific contributions.
                            </span>
                        </label>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={step === 'submitting' || !formData.consent}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500 disabled:opacity-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {step === 'submitting' && <Loader2 className="w-5 h-5 animate-spin"/>}
                            {step === 'submitting' ? 'Submitting Application...' : 'Submit Member Application'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
