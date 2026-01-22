'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ShieldAlert, FileText, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermission } from "@/hooks/usePermission";
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ReactMarkdown from 'react-markdown';

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
            markdown?: string;
            kpis?: { label: string; value: string; color?: string }[];
            timeline?: { step: string; duration: string }[];
            rules?: string[];
        };
        formSchema?: any; // Can be Record<string,string> (legacy) or FormField[] (new)
    };
    basePath?: string; // Optional base path for navigation (e.g., '/core', '/member')
}

export const GuideDetail: React.FC<GuideDetailProps> = ({ guide, basePath }) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [coverImageError, setCoverImageError] = useState(false);
    // Use dynamic permission based on guide type (EVENT -> 'event', PROGRAM -> 'program', CONTENT -> 'content')
    const hasWritePermission = usePermission(guide.type.toLowerCase(), 'WRITE');
    // Check if user is CORE (all CORE users can see applications, not just superadmins)
    const isCoreUser = (session?.user as any)?.role === 'CORE';
    const canEdit = hasWritePermission || isCoreUser;
    // Check if user is superadmin (for budget breakdown visibility)
    const userPermissions = (session?.user as any)?.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    // Cache-buster for blob URLs
    const getImageUrl = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.includes('.public.blob.vercel-storage.com')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}t=${Date.now()}`;
        }
        return url;
    };
    
    // Determine dashboard path based on current URL or basePath prop
    const getDashboardPath = () => {
        if (basePath) return basePath;
        // Auto-detect from current path
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/core')) return '/core';
            if (path.startsWith('/member')) return '/member';
        }
        return '/member'; // Default fallback
    };
    
    const dashboardPath = getDashboardPath();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [view, setView] = useState<'DETAILS' | 'APPLICATIONS'>('DETAILS');
    const [submitted, setSubmitted] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState<string>('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<any>(null);

    // Fetch user name and email from database
    useEffect(() => {
        if (session?.user?.email) {
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.name) setUserName(data.name);
                    if (data.email) setUserEmail(data.email);
                    // Pre-fill form data with name and email
                    setFormData(prev => ({
                        ...prev,
                        name: data.name || session.user?.name || '',
                        email: data.email || session.user?.email || ''
                    }));
                })
                .catch(err => {
                    console.error("Error fetching user profile:", err);
                    // Fallback to session data
                    const name = session.user?.name || '';
                    const email = session.user?.email || '';
                    setUserName(name);
                    setUserEmail(email);
                    setFormData(prev => ({
                        ...prev,
                        name,
                        email
                    }));
                });
        }
    }, [session]);

    // Default fields that are always present
    const defaultFields: FormField[] = [
        { id: 'name', key: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', key: 'email', label: 'Email', type: 'email', required: true }
    ];

    // Normalize form schema to array and combine with default fields
    const formFields: FormField[] = React.useMemo(() => {
        const customFields = !guide.formSchema 
            ? [] 
            : Array.isArray(guide.formSchema) 
                ? guide.formSchema 
                : Object.entries(guide.formSchema).map(([key, label]) => ({
                    id: key,
                    key,
                    label: label as string,
                    type: 'text',
                    required: true
                }));
        
        // Always include default fields first, then custom fields (excluding any duplicate name/email)
        const customFieldsFiltered = customFields.filter(f => f.key !== 'name' && f.key !== 'email');
        return [...defaultFields, ...customFieldsFiltered];
    }, [guide.formSchema]);

    // Filter out budget fields for non-superadmin CORE users viewing EVENT applications
    const visibleFormFields: FormField[] = React.useMemo(() => {
        // If not viewing applications in core, or if superadmin, show all fields
        if (!dashboardPath.startsWith('/core') || isSuperAdmin) {
            return formFields;
        }
        
        // For EVENT type only: hide budget-related fields from regular CORE users
        if (guide.type === 'EVENT' && !isSuperAdmin) {
            return formFields.filter(field => {
                const key = (field.key || '').toLowerCase();
                const label = (field.label || '').toLowerCase();
                return !key.includes('budget') && !label.includes('budget');
            });
        }
        
        return formFields;
    }, [formFields, isSuperAdmin, guide.type, dashboardPath]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionMessage('');
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guideId: guide.id,
                    data: formData
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
                // Different message for EVENT vs other types
                if (guide.type === 'EVENT') {
                    setSubmissionMessage('Application submitted successfully!');
                } else {
                    setSubmissionMessage('Application submitted successfully! You can apply again after 7 days.');
                }
                // Reset form data but keep name and email
                setFormData({
                    name: userName,
                    email: userEmail
                });
                // Reset submitted state - 3 seconds for EVENT, 10 seconds for others
                const resetTimeout = guide.type === 'EVENT' ? 3000 : 10000;
                setTimeout(() => {
                    setSubmitted(false);
                    setSubmissionMessage('');
                }, resetTimeout);
            } else {
                // Handle 7-day restriction or other errors
                if (res.status === 429 && data.message) {
                    setSubmissionMessage(data.message);
                } else {
                    setSubmissionMessage(data.error || 'Failed to submit application');
                }
            }
        } catch (error) {
            console.error(error);
            setSubmissionMessage('Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    React.useEffect(() => {
        if (canEdit) {
            fetch(`/api/guides/${guide.id}/applications`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setApplications(data);
                })
                .catch(err => console.error("Failed to load applications", err));
        }
    }, [guide.id, canEdit]);

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/guides/${guide.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.back();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusUpdate = async (appId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setApplications(prev => prev.map(app => 
                    app.id === appId ? { ...app, status: newStatus } : app
                ));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    // ... (render logic) ...

    return (
        <div className="max-w-6xl mx-auto">
            <Link href={dashboardPath} className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm font-medium hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            
            <ConfirmationModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Guide"
                message="Are you sure you want to delete this guide? This action cannot be undone."
                confirmText="Delete Guide"
                isDestructive={true}
            />

            {/* Application Detail Modal */}
            {showDetailModal && selectedApplication && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-3xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">Application Details</h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Submitted on {new Date(selectedApplication.submittedAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedApplication(null);
                                }}
                                className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="overflow-y-auto p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold uppercase text-zinc-500">Status:</span>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    selectedApplication.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' :
                                    selectedApplication.status === 'REJECTED' ? 'text-red-400 bg-red-500/10 border border-red-500/30' :
                                    'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                                }`}>
                                    {selectedApplication.status}
                                </span>
                            </div>

                            {/* Form Data */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-2">
                                    Form Responses
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {visibleFormFields.map((field) => {
                                        const value = selectedApplication.data?.[field.key] || selectedApplication.data?.[field.label] || '-';
                                        return (
                                            <div key={field.key || field.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                                                    {field.label}
                                                </label>
                                                <div className="text-sm text-white whitespace-pre-wrap break-words">
                                                    {value.toString()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional Application Info */}
                            {selectedApplication.authorEmail && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                                        Submission Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Submitted by:</span>
                                            <span className="text-white font-mono">{selectedApplication.authorEmail}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Application ID:</span>
                                            <span className="text-white font-mono text-xs">{selectedApplication.id}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer with Close Button */}
                        <div className="flex justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedApplication(null);
                                }}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Cover Image */}
            <div className="mb-8">
                {guide.coverImage && !coverImageError ? (
                    <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-6 border border-white/10 bg-zinc-900/50">
                        <img
                            src={getImageUrl(guide.coverImage) || guide.coverImage}
                            alt={guide.title}
                            className="w-full h-full object-cover"
                            onError={() => setCoverImageError(true)}
                        />
                    </div>
                ) : guide.coverImage && coverImageError ? (
                    <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-6 border border-white/10 bg-zinc-900/50 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-zinc-700" />
                    </div>
                ) : null}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{guide.title}</h1>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400">
                        {guide.type}
                    </span>
                </div>
            </div>

            <div className="flex justify-end mb-8">
                {canEdit && dashboardPath.startsWith('/core') && (
                        <div className="flex gap-2">
                             <button
                                onClick={() => router.push(`${window.location.pathname}/edit`)} 
                                className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                             >
                                Edit Guide
                             </button>
                             <button 
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm font-bold text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                             >
                                Delete
                             </button>
                        </div>
                    )}
            </div>
            {/* ... (rest of the component) ... */}

            {/* Admin Tabs - Visible only in Core Dashboard */}
            {canEdit && dashboardPath.startsWith('/core') && (
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
                                    {/* Dynamic Columns from Form Schema */}
                                    {visibleFormFields.map(field => (
                                        <th key={field.key || field.id} className="px-6 py-4 whitespace-nowrap">
                                            {field.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 whitespace-nowrap">Submitted</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {applications.map((app) => (
                                    <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                                        {/* Dynamic Data Cells */}
                                        {visibleFormFields.map(field => (
                                            <td key={field.key || field.id} className="px-6 py-4 text-white">
                                                <span className="line-clamp-2" title={(app.data?.[field.key] || app.data?.[field.label] || '').toString()}>
                                                    {(app.data?.[field.key] || app.data?.[field.label] || '-').toString()}
                                                </span>
                                            </td>
                                        ))}
                                        
                                        <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                                            {new Date(app.submittedAt).toLocaleDateString()}
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                                className={`pl-2 pr-1 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-transparent border cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 ${
                                                    app.status === 'APPROVED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                                    app.status === 'REJECTED' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                                    'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                                }`}
                                            >
                                                <option value="PENDING" className="bg-zinc-900 text-amber-400">Pending</option>
                                                <option value="APPROVED" className="bg-zinc-900 text-emerald-400">Approved</option>
                                                <option value="REJECTED" className="bg-zinc-900 text-red-400">Rejected</option>
                                            </select>
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedApplication(app);
                                                    setShowDetailModal(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all group"
                                            >
                                                <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                                View Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={visibleFormFields.length + 3} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                                    <FileText className="w-5 h-5 text-zinc-600" />
                                                 </div>
                                                 <p className="text-zinc-500 text-sm font-medium">No applications received yet.</p>
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
                        {guide.body.description && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                     Overview
                                </h2>
                                <p className="text-zinc-400 leading-relaxed text-base whitespace-pre-wrap">
                                    {guide.body.description}
                                </p>
                            </section>
                        )}

                        {/* Markdown Content */}
                        {guide.body.markdown && (
                            <section>
                                <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-blue-400 prose-strong:text-white prose-code:text-red-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-ul:text-zinc-300 prose-ol:text-zinc-300 prose-li:text-zinc-300 prose-blockquote:border-l-blue-500 prose-blockquote:text-zinc-400">
                                    <ReactMarkdown>{guide.body.markdown}</ReactMarkdown>
                                </div>
                            </section>
                        )}

                        {/* Legacy KPIs - kept for backward compatibility */}
                        {!guide.body.markdown && guide.body.kpis && guide.body.kpis.length > 0 && (
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

                        {/* Legacy Timeline - kept for backward compatibility */}
                        {!guide.body.markdown && guide.body.timeline && guide.body.timeline.length > 0 && (
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

                        {/* Legacy Rules - kept for backward compatibility */}
                         {!guide.body.markdown && guide.body.rules && guide.body.rules.length > 0 && (
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
                            
                            {submissionMessage && !submitted && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                                    <p className="text-amber-400 text-xs text-center">{submissionMessage}</p>
                                </div>
                            )}
                            {submitted ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 mx-auto mb-3 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <h4 className="text-white font-bold mb-1">Application Submitted!</h4>
                                    <p className="text-emerald-400 text-xs">
                                        {submissionMessage || (guide.type === 'EVENT' 
                                            ? 'Your application has been received successfully.' 
                                            : 'Your application has been received successfully. You can apply again after 7 days.')}
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formFields.length > 0 ? (
                                        formFields.map((field, idx) => {
                                            // Check if this is name or email field
                                            const fieldKey = (field.key || field.id || '').toLowerCase();
                                            const fieldLabel = (field.label || '').toLowerCase();
                                            const isNameField = fieldKey === 'name' || fieldLabel === 'name';
                                            const isEmailField = fieldKey === 'email' || fieldLabel === 'email';
                                            // Name is editable, email is read-only
                                            const isReadOnly = isEmailField;
                                            
                                            return (
                                                <div key={field.key || field.id || idx}>
                                                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                                                        {field.label} {field.required && <span className="text-white">*</span>}
                                                        {isEmailField && (
                                                            <span className="ml-2 text-[10px] text-emerald-400 font-normal">(Verified - Read Only)</span>
                                                        )}
                                                        {isNameField && !isEmailField && (
                                                            <span className="ml-2 text-[10px] text-zinc-500 font-normal">(Editable)</span>
                                                        )}
                                                    </label>

                                                    {/* Render input based on type */}
                                                    {field.type === 'textarea' ? (
                                                        <textarea
                                                            className={`w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700 min-h-[100px] resize-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                                            required={field.required}
                                                            readOnly={isReadOnly}
                                                            value={formData[field.key] || ''}
                                                            onChange={(e) => !isReadOnly && setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                                        />
                                                    ) : field.type === 'select' ? (
                                                        <select
                                                            className={`w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                                            required={field.required}
                                                            disabled={isReadOnly}
                                                            value={formData[field.key] || ''}
                                                            onChange={(e) => !isReadOnly && setFormData(p => ({ ...p, [field.key]: e.target.value }))}
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
                                                                disabled={isReadOnly}
                                                                checked={formData[field.key] || false}
                                                                onChange={(e) => !isReadOnly && setFormData(p => ({ ...p, [field.key]: e.target.checked }))}
                                                            />
                                                            <span className="text-sm text-zinc-300">{field.placeholder || "Yes, I agree"}</span>
                                                        </label>
                                                    ) : (
                                                        <input
                                                            type={field.type}
                                                            className={`w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                                            required={field.required}
                                                            readOnly={isReadOnly}
                                                            value={formData[field.key] || ''}
                                                            onChange={(e) => !isReadOnly && setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
