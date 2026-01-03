'use client';

import React, { useState, useEffect } from 'react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { History, Download, Calendar, User as UserIcon, Filter, Activity, FileText } from 'lucide-react';

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
            JSON.stringify(log.metadata || {}).replace(/"/g, '""') // Escape quotes
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

    return (
        <CoreWrapper>
            <CorePageHeader
                title="System Logs"
                description="Audit trail of critical system activities and changes."
                icon={<History className="w-5 h-5 text-zinc-200" />}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                        {pagination.total} Records
                    </span>
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </CorePageHeader>

            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl justify-between items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                             <Filter className="w-4 h-4 text-zinc-500" />
                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filter By:</span>
                        </div>

                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
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
                            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
                        >
                            <option value="ALL">All Resources</option>
                            <option value="MEDIA_KIT">Media Kit</option>
                            <option value="EXPERIMENT">Experiment</option>
                            <option value="GUIDE">Guide</option>
                            <option value="MEMBER">Member</option>
                        </select>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchLogs(pagination.page - 1)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                        >
                            Prev
                        </button>
                        <span className="text-xs text-zinc-400">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => fetchLogs(pagination.page + 1)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Actor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Resource</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                            Loading logs...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                            No logs found matching your filters.
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-xs text-zinc-400 font-mono">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {log.actor?.image ? (
                                                    <img src={log.actor.image} alt="" className="w-5 h-5 rounded-full" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                                                        <UserIcon className="w-3 h-3 text-zinc-500" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-white">{log.actor?.name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                log.action === 'DELETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-300">
                                            {log.resource}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate font-mono">
                                            {JSON.stringify(log.metadata)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </CoreWrapper>
    );
}
