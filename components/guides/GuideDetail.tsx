'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ShieldAlert, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FormField {
    id: string;
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'url' | 'tel';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

interface GuideDetailProps {
    guide: {
        id: string;
        title: string;
        type: string;
        coverImage?: string;
        body: {
            description: string;
            kpis?: { label: string; value: string; color?: string }[];
            timeline?: { step: string; duration: string }[];
            rules?: string[];
        };
        formSchema?: any; // Can be Record<string,string> (legacy) or FormField[] (new)
    };
}

export const GuideDetail: React.FC<GuideDetailProps> = ({ guide }) => {
    const router = useRouter();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(true); // TODO: Replace with real auth check
    const [applications, setApplications] = useState<any[]>([]);
    const [view, setView] = useState<'DETAILS' | 'APPLICATIONS'>('DETAILS');
    const [submitted, setSubmitted] = useState(false);

    // Normalize form schema to array
    const formFields: FormField[] = React.useMemo(() => {
        if (!guide.formSchema) return [];
        if (Array.isArray(guide.formSchema)) return guide.formSchema;
        // Legacy support
        return Object.entries(guide.formSchema).map(([key, label]) => ({
            id: key,
            key,
            label: label as string,
            type: 'text',
            required: true
        }));
    }, [guide.formSchema]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guideId: guide.id,
                    data: formData
                })
            });

            if (res.ok) {
                setSubmitted(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    React.useEffect(() => {
        if (isAdmin) {
            fetch(`/api/guides/${guide.id}/applications`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setApplications(data);
                })
                .catch(err => console.error("Failed to load applications", err));
        }
    }, [guide.id, isAdmin]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this guide?')) return;
        try {
            const res = await fetch(`/api/guides/${guide.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.back();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
                <p className="text-zinc-400 mb-8">We have received your request and will review it shortly within the specified timeline.</p>
                <button 
                    onClick={() => router.back()}
                    className="text-sm font-semibold text-white bg-zinc-800 px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                    Back to Guides
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => router.back()} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-medium mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Guides
                </button>
                
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-4">{guide.title}</h1>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                                {guide.type} Guide
                            </span>
                            {/* Tags/Audience */}
                             {(guide as any).audience?.map((tag: string) => (
                                <span key={tag} className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {tag}
                                </span>
                             ))}
                        </div>
                    </div>
                </div>
                
                {guide.coverImage && (
                    <div className="relative w-full h-[300px] mt-8 rounded-2xl overflow-hidden border border-white/5">
                        <img 
                            src={guide.coverImage} 
                            alt={guide.title} 
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                    </div>
                )}
            </div>
            
            <div className="flex justify-end mb-8">
                {isAdmin && (
                        <div className="flex gap-2">
                             <button
                                onClick={() => router.push(`${window.location.pathname}/edit`)} 
                                className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                             >
                                Edit Guide
                             </button>
                             <button 
                                onClick={handleDelete}
                                className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm font-bold text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                             >
                                Delete
                             </button>
                        </div>
                    )}
            </div>

            {/* Admin Tabs */}
            {isAdmin && (
                <div className="flex gap-6 border-b border-white/5 mb-8">
                    <button 
                        onClick={() => setView('DETAILS')}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${view === 'DETAILS' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Guide Details
                    </button>
                    <button 
                        onClick={() => setView('APPLICATIONS')}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${view === 'APPLICATIONS' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Applications ({applications.length})
                    </button>
                </div>
            )}

            {view === 'APPLICATIONS' ? (
                <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-white/5 font-bold text-white uppercase text-[10px] tracking-wider border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Applicant</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Submitted</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {applications.map((app) => (
                                    <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-white font-medium group-hover:text-white transition-colors">
                                            {app.applicantEmail}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                app.status === 'APPROVED' ? 'bg-white text-black border border-white' :
                                                app.status === 'REJECTED' ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through' :
                                                'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{new Date(app.submittedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md overflow-hidden text-xs bg-black/20 rounded p-2 border border-white/5 font-mono text-zinc-500">
                                                {Object.entries(app.data || {}).map(([key, val]) => (
                                                    <div key={key} className="flex gap-2">
                                                        <span className="text-zinc-600 shrink-0">{key}:</span>
                                                        <span className="text-zinc-300 truncate">{(val as any).toString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                                    <FileText className="w-5 h-5 text-zinc-600" />
                                                 </div>
                                                 <p className="text-zinc-500 text-sm font-medium">No applications received yet.</p>
                                                 <p className="text-zinc-600 text-xs mt-1">Applications submitted by users will appear here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Description */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                 Overview
                            </h2>
                            <p className="text-zinc-400 leading-relaxed text-base whitespace-pre-wrap">
                                {guide.body.description}
                            </p>
                        </section>

                        {/* KPIs */}
                        {guide.body.kpis && guide.body.kpis.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    Success Metrics
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {guide.body.kpis.map((kpi, idx) => (
                                        <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl text-center backdrop-blur-sm">
                                            <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">{kpi.label}</div>
                                            <div className="text-2xl font-bold text-white">{kpi.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Timeline */}
                        {guide.body.timeline && guide.body.timeline.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    Approval Timeline
                                </h2>
                                <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                    {guide.body.timeline.map((item, idx) => (
                                        <div key={idx} className="relative pl-10">
                                            <div className="absolute left-0 top-1.5 w-[30px] h-[30px] bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center z-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            </div>
                                            <h3 className="text-white font-medium text-sm">{item.step}</h3>
                                            <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> {item.duration}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Rules */}
                         {guide.body.rules && guide.body.rules.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    Guidelines & Usage
                                </h2>
                                <ul className="space-y-3">
                                    {guide.body.rules.map((rule, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-zinc-400 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                            <ShieldAlert className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Application Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
                            <h3 className="text-lg font-bold text-white mb-2">Apply Now</h3>
                            <p className="text-xs text-zinc-500 mb-6">Start this initiative by submitting the required details below.</p>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {formFields.length > 0 ? (
                                    formFields.map((field, idx) => (
                                        <div key={field.key || field.id || idx}>
                                            <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                                                {field.label} {field.required && <span className="text-white">*</span>}
                                            </label>
                                            
                                            {/* Render input based on type */}
                                            {field.type === 'textarea' ? (
                                                <textarea 
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700 min-h-[100px] resize-none"
                                                    placeholder={field.placeholder || `Enter ${field.label}...`}
                                                    required={field.required}
                                                    onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                                />
                                            ) : field.type === 'select' ? (
                                                <select
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                                    required={field.required}
                                                    onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Select an option</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'checkbox' ? (
                                                <label className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-black/30 transition-colors">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded bg-black border-white/20 text-white focus:ring-white"
                                                        required={field.required}
                                                        onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.checked }))}
                                                    />
                                                    <span className="text-sm text-zinc-300">{field.placeholder || "Yes, I agree"}</span>
                                                </label>
                                            ) : (
                                                <input 
                                                    type={field.type}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700"
                                                    placeholder={field.placeholder || `Enter ${field.label}...`}
                                                    required={field.required}
                                                    onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10 text-xs text-zinc-500">
                                        No application form required.
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || formFields.length === 0}
                                    className="w-full bg-white text-black font-bold py-3 rounded-lg mt-4 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
