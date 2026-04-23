'use client';

import React, { useState, useEffect } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { 
    History, Download, Filter, 
    Plus, Pencil, Trash2, LogIn, FileText, 
    ChevronLeft, ChevronRight, Activity, Calendar
} from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    resource: string;
    resourceId?: string;
    createdAt: string;
    metadata?: any;
    actor?: {
        name: string;
        image: string;
        email: string;
    }
}

export default function LogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    
    // Filters
    const [actionFilter, setActionFilter] = useState('ALL');
    const [resourceFilter, setResourceFilter] = useState('ALL');

    const fetchLogs = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '50');
            if (actionFilter !== 'ALL') params.set('action', actionFilter);
            if (resourceFilter !== 'ALL') params.set('resource', resourceFilter);
            
            const res = await fetch(`/api/logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.items);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [actionFilter, resourceFilter]);

    const handleDownload = () => {
        const headers = ["ID", "Date", "Actor", "Action", "Resource", "Resource ID", "Metadata"];
        const rows = logs.map(log => [
            log.id,
            new Date(log.createdAt).toISOString(),
            log.actor?.email || 'System',
            log.action,
            log.resource,
            log.resourceId || '',
            JSON.stringify(log.metadata || {}).replace(/"/g, '""')
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => `"${r.join('","')}"`)].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'system_logs.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <Plus className="w-4 h-4 text-emerald-400" />;
            case 'UPDATE': return <Pencil className="w-4 h-4 text-blue-400" />;
            case 'DELETE': return <Trash2 className="w-4 h-4 text-red-400" />;
            case 'LOGIN': return <LogIn className="w-4 h-4 text-purple-400" />;
            default: return <Activity className="w-4 h-4 text-zinc-400" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            case 'UPDATE': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
            case 'DELETE': return 'bg-red-500/10 border-red-500/20 text-red-400';
            case 'LOGIN': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
            default: return 'bg-zinc-200 dark:bg-zinc-800 border-black/5 dark:border-white/5 text-zinc-500 dark:text-zinc-400';
        }
    };

    return (
        <CoreWrapper>
            <CorePageHeader
                title="System Logs"
                description="Audit trail of critical system activities and changes."
                icon={<History className="w-5 h-5 text-red-500" />}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider hidden md:block">
                        {pagination.total} Records Found
                    </span>
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-white text-black dark:bg-white dark:text-black px-4 py-2 rounded-xl font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-lg shadow-black/5 dark:shadow-white/5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
            </CorePageHeader>

            <div className="space-y-6">
                {/* Filters & Pagination Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4">
                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                             <Filter className="w-3.5 h-3.5 text-zinc-400" />
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Filters</span>
                        </div>

                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-medium text-black dark:text-white focus:outline-none focus:border-red-500/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <option value="ALL">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                        </select>

                        <select 
                            value={resourceFilter}
                            onChange={(e) => setResourceFilter(e.target.value)}
                            className="bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-medium text-black dark:text-white focus:outline-none focus:border-red-500/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <option value="ALL">All Resources</option>
                            <option value="MEDIA_KIT">Media Kit</option>
                            <option value="EXPERIMENT">Experiment</option>
                            <option value="GUIDE">Guide</option>
                            <option value="MEMBER">Member</option>
                            <option value="PLAYBOOK">Playbook</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchLogs(pagination.page - 1)}
                            className="p-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-zinc-400 px-2">
                            {pagination.page} / {pagination.pages || 1}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => fetchLogs(pagination.page + 1)}
                            className="p-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-black dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Logs List - Card Style */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="py-20 text-center text-zinc-500 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/5 dark:border-white/5 rounded-3xl animate-pulse">
                            Loading logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-500 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/5 dark:border-white/5 rounded-3xl">
                            <FileText className="w-10 h-10 mb-4 opacity-20" />
                            <p>No logs found matching your filters.</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div 
                                key={log.id} 
                                className="group relative bg-white/20 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-5 hover:border-black/10 dark:hover:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    
                                    {/* Left: Icon & Main Info */}
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl border ${getActionColor(log.action)} mt-1 md:mt-0`}>
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-black dark:text-white">
                                                    {log.resource} <span className="text-zinc-500 font-normal">/</span> {log.action}
                                                </h3>
                                                <span className="text-[10px] text-zinc-500 font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5">
                                                    {log.actor?.image ? (
                                                        <img src={log.actor.image} alt="" className="w-3.5 h-3.5 rounded-full" />
                                                    ) : (
                                                        <div className="w-3.5 h-3.5 rounded-full bg-zinc-700" />
                                                    )}
                                                    <span className="font-bold text-zinc-600 dark:text-zinc-300">{log.actor?.name || 'System'}</span>
                                                </div>
                                                <span className="hidden md:inline text-zinc-400 dark:text-zinc-600">•</span>
                                                <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[150px] md:max-w-md opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {JSON.stringify(log.metadata)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Date */}
                                    <div className="flex items-center gap-4 pl-14 md:pl-0">
                                         <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </CoreWrapper>
    );
}
