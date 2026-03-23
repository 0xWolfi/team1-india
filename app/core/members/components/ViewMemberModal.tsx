"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, FileText, Loader2, Mail, MapPin, MessageCircle, Send, Tag, Twitter, Wallet, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CommunityMember {
    id: string;
    email: string;
    name?: string | null;
    tags?: string | null;
    status: string;
    xHandle?: string | null;
    telegram?: string | null;
    customFields?: any;
}

interface ViewMemberModalProps {
    member: CommunityMember | null;
    onClose: () => void;
    onDelete: (member: CommunityMember) => void;
    onRoleChange?: (memberId: string, newRole: string) => Promise<void>;
    isSubmitting?: boolean;
}

export const ViewMemberModal: React.FC<ViewMemberModalProps> = ({ 
    member, 
    onClose, 
    onDelete,
    onRoleChange,
    isSubmitting = false 
}) => {
    const router = useRouter();
    const [memberData, setMemberData] = useState<CommunityMember | null>(member);
    const [isChangingRole, setIsChangingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>(member?.tags || "member");

    useEffect(() => {
        if (member) {
            // Fetch full member details
            fetch(`/api/community-members/${member.id}`)
                .then(res => res.json())
                .then(data => {
                    setMemberData(data);
                    setSelectedRole(data.tags || "member");
                })
                .catch(err => {
                    console.error("Failed to fetch member details:", err);
                    setMemberData(member); // Fallback to passed member
                });
        }
    }, [member]);

    const handleRoleChange = async () => {
        if (!memberData || !onRoleChange) return;
        
        setIsChangingRole(true);
        try {
            await onRoleChange(memberData.id, selectedRole);
            setMemberData({ ...memberData, tags: selectedRole });
        } catch (error) {
            console.error("Failed to change role:", error);
            alert("Failed to change role. Please try again.");
        } finally {
            setIsChangingRole(false);
        }
    };

    if (!memberData) return null;

    const customFields = memberData.customFields || {};
    const wallet = customFields.wallet || '';
    const address = customFields.address || '';
    const discord = customFields.discord || '';
    const bio = customFields.bio || '';

    const getInitials = (name: string | null | undefined, email: string) => {
        if (name) return name.charAt(0).toUpperCase();
        return email.charAt(0).toUpperCase();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" 
            onClick={onClose}
        >
            <div 
                className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Member Details</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                    {/* Profile Picture & Basic Info */}
                    <div className="flex items-start gap-6 mb-8">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-3xl font-bold text-zinc-400 flex-shrink-0">
                            {getInitials(memberData.name, memberData.email)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-xl font-bold text-white">
                                    {memberData.name || "Unknown"}
                                </h4>
                                <button
                                    onClick={() => {
                                        onClose();
                                        router.push(`/core/members/${memberData.id}`);
                                    }}
                                    className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                                    title="View Full Details"
                                >
                                    <ExternalLink className="w-3 h-3"/>
                                    View in Detail
                                </button>
                            </div>
                            <p className="text-sm text-zinc-400 mb-3">{memberData.email}</p>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-zinc-900/50 text-zinc-400 border border-white/5 uppercase">
                                    {memberData.tags || 'member'}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                                    memberData.status === 'active' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                        : 'bg-zinc-900/50 text-zinc-500 border border-white/5'
                                }`}>
                                    {memberData.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Change Role Section */}
                    <div className="mb-8 p-4 bg-zinc-900/30 border border-white/5 rounded-xl">
                        <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4"/>
                            Change Role
                        </label>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                            >
                                <option value="member" className="bg-zinc-900">Member</option>
                                <option value="collaborator" className="bg-zinc-900">Collaborator</option>
                            </select>
                            <button
                                onClick={handleRoleChange}
                                disabled={isChangingRole || selectedRole === memberData.tags}
                                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isChangingRole ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin"/>
                                        Updating...
                                    </>
                                ) : (
                                    "Update Role"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-6">
                        <h5 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Contact Information</h5>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                <Mail className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-zinc-500 mb-1">Email</div>
                                    <div className="text-sm text-white break-all">{memberData.email}</div>
                                </div>
                            </div>

                            {memberData.xHandle && (
                                <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                    <Twitter className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500 mb-1">X (Twitter) Handle</div>
                                        <div className="text-sm text-white">@{memberData.xHandle.replace('@', '')}</div>
                                    </div>
                                </div>
                            )}

                            {memberData.telegram && (
                                <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                    <Send className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500 mb-1">Telegram Handle</div>
                                        <div className="text-sm text-white">@{memberData.telegram.replace('@', '')}</div>
                                    </div>
                                </div>
                            )}

                            {discord && (
                                <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                    <MessageCircle className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500 mb-1">Discord Handle</div>
                                        <div className="text-sm text-white">{discord}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="mb-6">
                        <h5 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Additional Information</h5>
                        <div className="space-y-3">
                            {wallet && (
                                <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                    <Wallet className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500 mb-1">Wallet Address</div>
                                        <div className="text-sm text-white break-all font-mono">{wallet}</div>
                                    </div>
                                </div>
                            )}

                            {address && (
                                <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                    <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500 mb-1">Location / Address</div>
                                        <div className="text-sm text-white">{address}</div>
                                    </div>
                                </div>
                            )}

                            {bio && (
                                <div className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                                    <FileText className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500 mb-1">Bio</div>
                                        <div className="text-sm text-white whitespace-pre-wrap">{bio}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => onDelete(memberData)}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-400 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin"/>
                                Removing...
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4"/>
                                Remove Member
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
