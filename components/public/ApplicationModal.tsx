'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApplicationModal({ isOpen, onClose }: ApplicationModalProps) {
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
        
        consent: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to submit application');
            
            setStep('success');
            // Reset form after delay or on close?
        } catch (err) {
            console.error(err);
            setStep('error');
            setError('Something went wrong. Please try again.');
        }
    };

    const reset = () => {
        setStep('form');
        setFormData({
            name: '', email: '', telegram: '', xHandle: '', about: '', resumeLink: '', skills: '', country: '',
            q_whyJoin: '', q_howHelp: '', q_weeklyHours: '', q_expectations: '',
            github: '', otherLink: '', referredBy: '', consent: false
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={reset} title="Apply for Membership">
            {step === 'success' ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Application Submitted!</h3>
                    <p className="text-zinc-400">
                        Thank you for volunteering. The Core team will review your application and reach out via Telegram or Email.
                    </p>
                    <button onClick={reset} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors mt-4">
                        Close
                    </button>
                </div>
            ) : step === 'error' ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Submission Failed</h3>
                    <p className="text-zinc-400">{error}</p>
                    <div className="flex gap-4">
                        <button onClick={reset} className="px-6 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors">
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
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name *</label>
                                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Telegram Handle *</label>
                                <input required name="telegram" value={formData.telegram} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="@username" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">X Handle (Twitter) *</label>
                                <input required name="xHandle" value={formData.xHandle} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="@username" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Country *</label>
                                <input required name="country" value={formData.country} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="e.g. India" />
                            </div>
                        </div>
                    </div>

                    {/* Check-ins */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Experience & Skills</h4>
                         <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Short Bio / About You *</label>
                            <textarea required name="about" value={formData.about} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 h-24" placeholder="Tell us a bit about yourself..." />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Resume / Portfolio Link *</label>
                                <input required type="url" name="resumeLink" value={formData.resumeLink} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="https://" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Top Skills (comma separated) *</label>
                                <input required name="skills" value={formData.skills} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="React, Solidity, Design, Marketing..." />
                            </div>
                         </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Community Fit</h4>
                        
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Why do you want to be a member? *</label>
                            <textarea required name="q_whyJoin" value={formData.q_whyJoin} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">How can you help Team1? *</label>
                            <textarea required name="q_howHelp" value={formData.q_howHelp} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 h-20" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">What are you expecting from us? *</label>
                            <textarea required name="q_expectations" value={formData.q_expectations} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Hours available weekly? *</label>
                            <input required name="q_weeklyHours" value={formData.q_weeklyHours} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="e.g. 5-10 hours" />
                        </div>
                    </div>

                    {/* Optional / Meta */}
                    <div className="space-y-4">
                         <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Additional Info</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">GitHub (Optional)</label>
                                <input name="github" value={formData.github} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" placeholder="github.com/username" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Referred By (Optional)</label>
                                <input name="referredBy" value={formData.referredBy} onChange={handleChange} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30" />
                            </div>
                         </div>
                    </div>

                    {/* Consent */}
                    <div className="pt-4 border-t border-white/5">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input required type="checkbox" name="consent" checked={formData.consent} onChange={handleCheckbox} className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 focus:ring-emerald-500" />
                            <span className="text-sm text-zinc-400 group-hover:text-zinc-300">
                                I understand that this is a <strong>volunteer opportunity</strong>. There is no monetary compensation for membership, but as a member, I may earn bounties or grants for specific contributions.
                            </span>
                        </label>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={step === 'submitting' || !formData.consent}
                            className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {step === 'submitting' && <Loader2 className="w-5 h-5 animate-spin" />}
                            {step === 'submitting' ? 'Submitting Application...' : 'Submit Member Application'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
