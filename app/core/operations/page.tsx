"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, LayoutDashboard, ListTodo, Plus, Video } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useSession } from "next-auth/react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ScheduleMeetingModal } from "@/components/core/ScheduleMeetingModal";

// Types
export interface Operation {
    id: string;
    title: string;
    type: 'task' | 'meeting';
    status: 'todo' | 'in_progress' | 'review' | 'done';
    dueDate?: string;
    timeEstimate?: number;
    timeLogged?: number;
    assignee?: { id: string; email: string; };
    createdAt: string;
}

export default function OperationsPage() {
    const { data: session } = useSession();
    const [view, setView] = useState<'board' | 'calendar' | 'time' | 'list'>('board');
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

    const fetchOperations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/operations');
            if (res.ok) {
                const data = await res.json();
                setOperations(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperations();
    }, []);

    // Placeholder data for design
    const tabs = [
        { id: 'board', label: 'Task Board', iconName: "LayoutDashboard" },
        { id: 'list', label: 'List View', iconName: "ListTodo" },
        { id: 'calendar', label: 'Calendar', iconName: "Calendar" },
        { id: 'time', label: 'Time Logs', iconName: "Clock" },
    ];

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Operations Center"
                description="Manage tasks, sprints, and operational workflows."
                icon={<CheckCircle2 className="w-5 h-5 text-zinc-700 dark:text-zinc-200"/>}
            >
                <button 
                    className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-lg bg-white px-4 font-medium text-black transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 text-sm"
                    onClick={() => alert("Create Task Modal Coming Soon")}
                >
                    <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4"/> New Task
                    </span>
                </button>
            </CorePageHeader>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-xl w-fit max-w-full mb-8 border border-black/5 dark:border-white/5 backdrop-blur-sm overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            view === tab.id 
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white shadow-lg ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        <DynamicIcon name={tab.iconName} className="w-4 h-4"/>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading Operations...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Render View Specific Content */}
                        {view === 'board' && (
                            <div className="p-8 sm:p-12 md:p-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-100/20 dark:bg-zinc-900/20">
                                <LayoutDashboard className="w-12 h-12 mb-4 opacity-50"/>
                                <h3 className="text-lg font-semibold mb-1 text-zinc-600 dark:text-zinc-300">Kanban Board</h3>
                                <p className="text-sm">Task cards and drag-and-drop workflow will be here.</p>
                            </div>
                        )}
                        {view === 'calendar' && (
                             <div className="p-8 sm:p-12 md:p-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-100/20 dark:bg-zinc-900/20 text-center">
                                <Calendar className="w-12 h-12 mb-4 opacity-50"/>
                                <h3 className="text-lg font-semibold mb-1 text-zinc-600 dark:text-zinc-300">Calendar View</h3>
                                <p className="text-sm mb-6">Monthly schedule and deadlines.</p>
                                <button 
                                    className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 px-6 font-medium text-black dark:text-white transition-all active:scale-95 text-sm border border-black/10 dark:border-white/10"
                                    onClick={() => setIsMeetingModalOpen(true)}
                                >
                                    <span className="flex items-center gap-2">
                                        <Video className="w-4 h-4"/> Schedule Google Meet
                                    </span>
                                </button>
                            </div>
                        )}
                        {view === 'list' && (
                             <div className="p-8 sm:p-12 md:p-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-100/20 dark:bg-zinc-900/20">
                                <ListTodo className="w-12 h-12 mb-4 opacity-50"/>
                                <h3 className="text-lg font-semibold mb-1 text-zinc-600 dark:text-zinc-300">List View</h3>
                                <p className="text-sm">Detailed list of tasks and assignments.</p>
                            </div>
                        )}
                        {view === 'time' && (
                             <div className="p-8 sm:p-12 md:p-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-100/20 dark:bg-zinc-900/20">
                                <Clock className="w-12 h-12 mb-4 opacity-50"/>
                                <h3 className="text-lg font-semibold mb-1 text-zinc-600 dark:text-zinc-300">Time Logs</h3>
                                <p className="text-sm">Tracked time and performance metrics.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Schedule Meeting Modal */}
            <ScheduleMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                onSuccess={() => {
                    fetchOperations();
                }}
            />
        </CoreWrapper>
    );
}
