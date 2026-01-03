"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Calendar, Clock, Plus, CheckCircle2, ListTodo } from "lucide-react";
import { useSession } from "next-auth/react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";

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
        { id: 'board', label: 'Task Board', icon: LayoutDashboard },
        { id: 'list', label: 'List View', icon: ListTodo },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'time', label: 'Time Logs', icon: Clock },
    ];

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Operations Center"
                description="Manage tasks, sprints, and operational workflows."
                icon={<CheckCircle2 className="w-5 h-5 text-zinc-200" />}
            >
                <button 
                    className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-lg bg-white px-4 font-medium text-black transition-all hover:bg-zinc-200 active:scale-95 text-sm"
                    onClick={() => alert("Create Task Modal Coming Soon")}
                >
                    <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Task
                    </span>
                </button>
            </CorePageHeader>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl w-fit mb-8 border border-white/5 backdrop-blur-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            view === tab.id 
                            ? 'bg-zinc-800 text-white shadow-lg ring-1 ring-white/5' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
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
                            <div className="p-16 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
                                <LayoutDashboard className="w-12 h-12 mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-1 text-zinc-300">Kanban Board</h3>
                                <p className="text-sm">Task cards and drag-and-drop workflow will be here.</p>
                            </div>
                        )}
                        {view === 'calendar' && (
                             <div className="p-16 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
                                <Calendar className="w-12 h-12 mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-1 text-zinc-300">Calendar View</h3>
                                <p className="text-sm">Monthly schedule and deadlines.</p>
                            </div>
                        )}
                        {view === 'list' && (
                             <div className="p-16 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
                                <ListTodo className="w-12 h-12 mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-1 text-zinc-300">List View</h3>
                                <p className="text-sm">Detailed list of tasks and assignments.</p>
                            </div>
                        )}
                        {view === 'time' && (
                             <div className="p-16 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
                                <Clock className="w-12 h-12 mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-1 text-zinc-300">Time Logs</h3>
                                <p className="text-sm">Tracked time and performance metrics.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CoreWrapper>
    );
}
