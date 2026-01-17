'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, Search, Download, Upload, Trash2, 
    MoreVertical, Save, X, Columns, GripVertical, Pencil 
} from 'lucide-react';
import { CorePageHeader } from "@/components/core/CorePageHeader";

interface Column {
    id: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'select' | 'date';
    visible: boolean;
    width?: number;
    options?: string[]; // For select types
}

interface DataGridProps {
    tableName: 'members' | 'projects' | 'partners';
    title: string;
    description: string;
    icon: React.ReactNode;
}

export function DataGrid({ tableName, title, description, icon }: DataGridProps) {
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI States
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [newColData, setNewColData] = useState({ label: '', type: 'text' });
    const [isSaving, setIsSaving] = useState(false);

    // Row Modal State (Add/Edit)
    const [isRowModalOpen, setIsRowModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<any | null>(null);
    const [rowFormData, setRowFormData] = useState<any>({});

    // Feedback Modal State (Alerts & Confirms)
    const [feedbackModal, setFeedbackModal] = useState<{ 
        isOpen: boolean; 
        type: 'alert' | 'confirm'; 
        title: string;
        message: string; 
        onConfirm?: () => void;
        isLoading?: boolean;
    }>({ isOpen: false, type: 'alert', title: '', message: '' });

    // Pending Data for Async Confirmations (like Paste)
    const [pendingPasteRows, setPendingPasteRows] = useState<any[] | null>(null);

    // Initial default columns based on table
    const getDefaultColumns = (): Column[] => {
        const common: Column[] = [
             // Standard fields
             // We map standard DB fields to columns, user can add custom fields
        ];
        
        switch (tableName) {
            case 'members':
                return [
                    { id: 'name', label: 'Name', type: 'text', visible: true },
                    { id: 'email', label: 'Email', type: 'email', visible: true },
                    { id: 'tags', label: 'Role', type: 'select', visible: true, options: ['member', 'contributor'] },
                    { id: 'status', label: 'Status', type: 'select', visible: false, options: ['applied', 'approved', 'active', 'paused'] },
                ];
            case 'projects':
                return [
                    { id: 'name', label: 'Project Name', type: 'text', visible: true },
                    { id: 'status', label: 'Status', type: 'select', visible: true, options: ['active', 'completed', 'hold'] },
                    { id: 'visibility', label: 'Visibility', type: 'select', visible: true, options: ['CORE', 'MEMBER', 'PUBLIC'] },
                    { id: 'logo', label: 'Logo URL', type: 'text', visible: true },
                    { id: 'website', label: 'Website', type: 'text', visible: true },
                    { id: 'twitter', label: 'X (Twitter)', type: 'text', visible: false },
                    { id: 'telegram', label: 'Telegram', type: 'text', visible: false },
                ];
            case 'partners':
                return [
                    { id: 'name', label: 'Partner Name', type: 'text', visible: true },
                    { id: 'type', label: 'Type', type: 'select', visible: true, options: ['Sponsor', 'Community', 'Vendor'] },
                    { id: 'status', label: 'Status', type: 'select', visible: true, options: ['active', 'inactive'] },
                    { id: 'visibility', label: 'Visibility', type: 'select', visible: true, options: ['CORE', 'MEMBER', 'PUBLIC'] },
                    { id: 'logo', label: 'Logo URL', type: 'text', visible: true },
                    { id: 'website', label: 'Website', type: 'text', visible: true },
                    { id: 'twitter', label: 'X (Twitter)', type: 'text', visible: false },
                    { id: 'telegram', label: 'Telegram', type: 'text', visible: false },
                ];
        }
        return [];
    };

    // Fetch Data & Config
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/data-grid/${tableName}`);
            if (res.ok) {
                const { data: rowData, config } = await res.json();
                setData(rowData);
                
                // Merge default columns with saved config
                // If saved config is empty, use default and save it
                if (!config || config.length === 0) {
                    const defaults = getDefaultColumns();
                    setColumns(defaults);
                    saveConfig(defaults);
                } else {
                    setColumns(config);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [tableName]);

    // Config Saving
    const saveConfig = async (newCols: Column[]) => {
        try {
            await fetch(`/api/data-grid/${tableName}/config`, {
                method: 'POST',
                body: JSON.stringify({ columns: newCols })
            });
        } catch (e) {
            console.error("Failed to save config", e);
        }
    };

    // Cell Update
    const handleCellUpdate = async (id: string, field: string, value: any, isCustom: boolean) => {
        // Optimistic update
        const oldData = [...data];
        setData(prev => prev.map(row => {
            if (row.id === id) {
                if (isCustom) {
                    return { ...row, customFields: { ...row.customFields, [field]: value } };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));

        try {
            let payload: any = {};
            if (isCustom) {
                // We need to fetch current custom fields state or rely on what we have in optimistic
                // Ideally backend handles merge, but here we replace. 
                // Simple approach: Send just the update, backend must handle merge. 
                // Current generic patch replaces root fields. 
                // For customFields, we need to send the ENTIRE object.
                const row = data.find(r => r.id === id);
                const currentCustom = row?.customFields || {};
                payload = { customFields: { ...currentCustom, [field]: value } };
            } else {
                payload = { [field]: value };
            }

            await fetch(`/api/data-grid/${tableName}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } catch (e) {
            setData(oldData); // Revert
            console.error("Update failed", e);
        }
    };

    // Add Column
    const handleAddColumn = async () => {
        if (!newColData.label) return;

        // Check if a standard column (hidden) exists with this label (case-insensitive)
        const standardColIndex = columns.findIndex(c => 
            !c.id.startsWith('custom_') && 
            c.label.toLowerCase() === newColData.label.toLowerCase()
        );

        if (standardColIndex !== -1) {
             // Unhide standard column
             const updatedCols = [...columns];
             updatedCols[standardColIndex] = { ...updatedCols[standardColIndex], visible: true };
             setColumns(updatedCols);
             saveConfig(updatedCols);
        } else {
            // Create new custom column
            const newCol: Column = {
                id: `custom_${Date.now()}`, // Unique ID for custom field
                label: newColData.label,
                type: newColData.type as any,
                visible: true
            };
            const updatedCols = [...columns, newCol];
            setColumns(updatedCols);
            saveConfig(updatedCols);
        }
        
        setIsAddColumnOpen(false);
        setNewColData({ label: '', type: 'text' });
    };

    // Add Row (Trigger Modal for Members, Direct for others)
    const handleAddRow = async () => {
        if (tableName === 'members') {
            setEditingRow(null);
            setRowFormData({ name: '', email: '', tags: 'member' }); // Default role
            setIsRowModalOpen(true);
            return;
        }

        // Default behavior for other tables
        try {
            setIsSaving(true);
            const res = await fetch(`/api/data-grid/${tableName}`, {
                method: 'POST',
                body: JSON.stringify({ 
                    // Basic defaults
                    ...(tableName === 'projects' || tableName === 'partners' ? { name: 'New Item' } : { email: `new${Date.now()}@example.com`, status: 'applied' })
                })
            });
            if (res.ok) {
                const newItem = await res.json();
                setData([newItem, ...data]);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Edit Row Trigger
    const handleEditRowTrigger = (row: any) => {
        setEditingRow(row);
        // Map row data to form data
        // For tags (Role), ensure string format if array
        const role = Array.isArray(row.tags) ? row.tags[0] : row.tags;
        setRowFormData({ 
            name: row.name || '', 
            email: row.email || '', 
            tags: role || 'member' 
        });
        setIsRowModalOpen(true);
    };

    // Save Row (From Modal)
    const handleSaveRow = async () => {
        if (!rowFormData.name || !rowFormData.email) {
            setFeedbackModal({ 
                isOpen: true, 
                type: 'alert', 
                title: 'Validation Error', 
                message: "Name and Email are required" 
            });
            return;
        }

        setIsSaving(true);
        try {
            if (editingRow) {
                // UPDATE
                const res = await fetch(`/api/data-grid/${tableName}/${editingRow.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(rowFormData)
                });
                if (res.ok) {
                    const updatedItem = await res.json();
                    setData(prev => prev.map(item => item.id === editingRow.id ? updatedItem : item));
                    setIsRowModalOpen(false);
                }
            } else {
                // CREATE
                const res = await fetch(`/api/data-grid/${tableName}`, {
                    method: 'POST',
                    body: JSON.stringify({ ...rowFormData, status: 'approved' }) // Default status for manually added members
                });
                if (res.ok) {
                    const newItem = await res.json();
                    setData([newItem, ...data]);
                    setIsRowModalOpen(false);
                }
            }
        } catch (error) {
            console.error(error);
            setFeedbackModal({ 
                isOpen: true, 
                type: 'alert', 
                title: 'Error', 
                message: "Failed to save the record. Please try again." 
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Paste Handler
    const handlePaste = async (e: React.ClipboardEvent) => {
        e.preventDefault();
        const clipboardData = e.clipboardData.getData('text');
        const rows = clipboardData.split('\n').filter(r => r.trim());
        
        // Simple CSV parser logic (tab or comma separated)
        const parsedData = rows.map(row => {
            const cells = row.split('\t');
            const dataObj: any = {};
            let customFields: any = {};
            
            // Map cells to visible columns
            const visibleCols = columns.filter(c => c.visible);
            cells.forEach((cell, idx) => {
                if (idx < visibleCols.length) {
                    const col = visibleCols[idx];
                    if (col.id.startsWith('custom_')) {
                        customFields[col.label] = cell.trim();
                         customFields[col.id] = cell.trim();
                    } else {
                        dataObj[col.id] = cell.trim();
                    }
                }
            });
            if (Object.keys(customFields).length > 0) dataObj.customFields = customFields;
            return dataObj;
        });

        if (parsedData.length > 0) {
            setPendingPasteRows(parsedData);
            setFeedbackModal({
                isOpen: true,
                type: 'confirm',
                title: 'Import Data',
                message: `Paste detected. Do you want to create ${parsedData.length} new rows?`,
                onConfirm: confirmPaste
            });
        }
    };

    const confirmPaste = async () => {
        if (!pendingPasteRows) return;
        
        setFeedbackModal(prev => ({ ...prev, isLoading: true }));
        try {
            const res = await fetch(`/api/data-grid/${tableName}`, {
                method: 'POST',
                body: JSON.stringify(pendingPasteRows)
            });
            if (res.ok) {
                fetchData(); // Refresh all
                setFeedbackModal({ isOpen: false, type: 'alert', title: '', message: '' });
                setPendingPasteRows(null);
            }
        } finally {
            setFeedbackModal(prev => ({ ...prev, isLoading: false }));
        }
    };
    
    // Actions Wrapper for Columns/Rows
    const handleDeleteColumn = (colId: string) => {
        setFeedbackModal({
            isOpen: true,
            type: 'confirm',
            title: 'Delete Column',
            message: 'Are you sure you want to delete this column? Data in this column will be hidden.',
            onConfirm: () => {
                const updated = columns.map(c => c.id === colId ? {...c, visible: false} : c);
                setColumns(updated);
                saveConfig(updated);
                setFeedbackModal({ isOpen: false, type: 'alert', title: '', message: '' });
            }
        });
    };

    const handleDeleteRow = (rowId: string) => {
        setFeedbackModal({
            isOpen: true,
            type: 'confirm',
            title: 'Delete Row',
            message: 'Are you sure you want to permanently delete this row?',
            onConfirm: async () => {
                setFeedbackModal(prev => ({ ...prev, isLoading: true }));
                await fetch(`/api/data-grid/${tableName}/${rowId}`, { method: 'DELETE' });
                fetchData();
                setFeedbackModal({ isOpen: false, type: 'alert', title: '', message: '' });
            }
        });
    };

    // Export
    const handleExport = () => {
        const headers = columns.filter(c => c.visible).map(c => c.label).join(',');
        const rows = data.map(row => {
            return columns.filter(c => c.visible).map(col => {
                if (col.id.startsWith('custom_')) {
                    return row.customFields?.[col.id] || '';
                }
                return row[col.id] || '';
            }).join(',');
        }).join('\n');
        
        const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_export.csv`;
        a.click();
    };

    const filteredData = data.filter(item => {
        const searchStr = searchQuery.toLowerCase();
        // Search in all columns
        return Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchStr)
        ) || 
        (item.customFields && Object.values(item.customFields).some(val => 
             String(val).toLowerCase().includes(searchStr)
        ));
    });

    return (
        <div className="space-y-6" onPaste={handlePaste}>
             {/* Header */}
             <CorePageHeader
                title={title}
                description={description}
                icon={icon}
             >
                <div className="flex items-center gap-2">
                     <button onClick={handleExport} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Export CSV">
                        <Download className="w-5 h-5" />
                     </button>
                      <button 
                        onClick={() => setIsAddColumnOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 text-zinc-300 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
                      >
                        <Columns className="w-4 h-4" /> Add Column
                      </button>
                      <button 
                        onClick={handleAddRow}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors text-sm font-bold active:scale-95 shadow-lg shadow-white/5"
                      >
                        <Plus className="w-4 h-4" /> New Row
                      </button>
                </div>
             </CorePageHeader>

             {/* Toolbar */}
             <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                </div>
                <div className="text-xs text-zinc-500 italic">
                    💡 Tip: Paste (Ctrl+V) data from Excel/CSV to bulk create rows.
                </div>
             </div>

             {/* Grid */}
             <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl overflow-x-auto">
                 <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-zinc-800/80 text-zinc-400 font-medium uppercase text-xs sticky top-0 z-10">
                        <tr>
                            {columns.filter(c => c.visible).map(col => (
                                <th key={col.id} className="px-4 py-3 border-r border-white/5 min-w-[150px] whitespace-nowrap group relative">
                                    <div className="flex items-center justify-between">
                                        {col.label}
                                        {col.id.startsWith('custom_') && (
                                            <Trash2 
                                                className="w-3 h-3 text-zinc-600 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDeleteColumn(col.id)}
                                            />
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="w-10 px-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr><td colSpan={columns.length + 1} className="p-12 text-center text-zinc-500">Loading data...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="p-12 text-center text-zinc-500">No data found. Add a row or paste data.</td></tr>
                        ) : (
                            filteredData.map(row => (
                                <tr key={row.id} className="group hover:bg-white/[0.02]">
                                    {columns.filter(c => c.visible).map(col => {
                                        const isCustom = col.id.startsWith('custom_');
                                        let val = isCustom ? row.customFields?.[col.id] : row[col.id];
                                        

                                        
                                        return (
                                            <td key={`${row.id}_${col.id}`} className="p-0 border-r border-white/5 relative focus-within:ring-1 focus-within:ring-indigo-500 z-0">
                                                {col.type === 'select' && col.options ? (
                                                    <select
                                                        className="w-full h-full p-3 bg-transparent text-white focus:outline-none appearance-none cursor-pointer"
                                                        value={val || ''}
                                                        onChange={(e) => handleCellUpdate(row.id, col.id, e.target.value, isCustom)}
                                                    >
                                                        <option value="" className="bg-zinc-900 text-zinc-500">- Select -</option>
                                                        {col.options.map(opt => (
                                                            <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input 
                                                        className="w-full h-full p-3 bg-transparent text-white focus:outline-none placeholder:text-zinc-700"
                                                        value={val || ''}
                                                        onChange={(e) => handleCellUpdate(row.id, col.id, e.target.value, isCustom)}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 text-right whitespace-nowrap">
                                         {/* Edit Button (Only for Members for now, or unified if generic) */}
                                         {tableName === 'members' && (
                                            <button 
                                                className="p-2 text-zinc-600 hover:text-white transition-colors"
                                                onClick={() => handleEditRowTrigger(row)}
                                                title="Edit Member"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                         )}
                                        <button 
                                            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                                            onClick={() => handleDeleteRow(row.id)}
                                            title="Delete Row"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                 </table>
             </div>

             {/* Feedback Modal (Alert/Confirm) */}
             {feedbackModal.isOpen && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                     <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                         <h3 className="text-lg font-bold text-white mb-2">{feedbackModal.title}</h3>
                         <p className="text-zinc-400 text-sm mb-6">{feedbackModal.message}</p>
                         
                         <div className="flex gap-2 justify-end">
                             {feedbackModal.type === 'confirm' && (
                                 <button 
                                     onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })} 
                                     className="px-4 py-2 text-zinc-400 hover:text-white"
                                 >
                                     Cancel
                                 </button>
                             )}
                             <button 
                                 onClick={() => {
                                     if (feedbackModal.type === 'confirm' && feedbackModal.onConfirm) {
                                         feedbackModal.onConfirm();
                                     } else {
                                         setFeedbackModal({ ...feedbackModal, isOpen: false });
                                     }
                                 }} 
                                 disabled={feedbackModal.isLoading}
                                 className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${feedbackModal.type === 'confirm' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}
                             >
                                 {feedbackModal.isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                 {feedbackModal.type === 'confirm' ? 'Confirm' : 'OK'}
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {/* Add Column Modal */}
             {isAddColumnOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                     <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Add New Column</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Column Name</label>
                                <input 
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={newColData.label}
                                    onChange={e => setNewColData({...newColData, label: e.target.value})}
                                    placeholder="e.g. Phone Number"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Data Type</label>
                                <select
                                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                     value={newColData.type}
                                     onChange={e => setNewColData({...newColData, type: e.target.value})}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="email">Email</option>
                                    <option value="date">Date</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button onClick={() => setIsAddColumnOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
                                <button onClick={handleAddColumn} className="px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200">Add Column</button>
                            </div>
                        </div>
                     </div>
                 </div>
             )}

             {/* Row Add/Edit Modal (Members Only for now) */}
             {isRowModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                     <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6">
                            {editingRow ? 'Edit Member' : 'Add New Member'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Name</label>
                                <input 
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={rowFormData.name}
                                    onChange={e => setRowFormData({...rowFormData, name: e.target.value})}
                                    placeholder="Full Name"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Email</label>
                                <input 
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={rowFormData.email}
                                    onChange={e => setRowFormData({...rowFormData, email: e.target.value})}
                                    placeholder="member@example.com"
                                    type="email"
                                    disabled={!!editingRow} // Maybe allow email edit? Usually email is ID. But let's allow it if needed, or disable if risky. Let's allow for now.
                                />
                            </div>
                             <div>
                                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Role</label>
                                <select
                                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                     value={rowFormData.tags}
                                     onChange={e => setRowFormData({...rowFormData, tags: e.target.value})}
                                >
                                    <option value="member">Member</option>
                                    <option value="contributor">Contributor</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-2 justify-end pt-4">
                                <button 
                                    onClick={() => setIsRowModalOpen(false)} 
                                    className="px-4 py-2 text-zinc-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveRow} 
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 flex items-center gap-2"
                                >
                                    {isSaving && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                    {editingRow ? 'Save Changes' : 'Add Member'}
                                </button>
                            </div>
                        </div>
                     </div>
                 </div>
             )}
        </div>
    );
}
