import { 
    FileText, Briefcase, Image as ImageIcon, Calendar, BookOpen, Layers, UserCheck, FolderKanban, Handshake, FlaskConical, Newspaper, FileTerminal, ClipboardList
} from "lucide-react";

export interface Member {
    id: string;
    email: string;
    permissions: Record<string, string>;
    tags: string[];
    status: string;
    createdAt: string;
    customFields: Record<string, unknown>;
}

export const PERMISSION_SCOPES = [
    { key: 'playbooks', label: 'Playbooks', icon: FileText, description: 'Manage strategy docs' },
    { key: 'operations', label: 'Operations', icon: Briefcase, description: 'Operational workflows' },
    { key: 'media', label: 'Media', icon: ImageIcon, description: 'Photo & Video assets' },
    { key: 'events', label: 'Event Guide', icon: Calendar, description: 'Event planning & guides' },
    { key: 'programs', label: 'Program Guide', icon: BookOpen, description: 'Educational programs' },
    { key: 'content', label: 'Content', icon: Layers, description: 'General content management' },
    { key: 'members', label: 'Members Details', icon: UserCheck, description: 'User data & protocols' },
    { key: 'projects', label: 'Projects', icon: FolderKanban, description: 'Project tracking' },
    { key: 'partners', label: 'Partners', icon: Handshake, description: 'Partner relationships' },
    { key: 'experiments', label: 'Experiments', icon: FlaskConical, description: 'R&D and testing' },
    { key: 'mediakit', label: 'Mediakit', icon: Newspaper, description: 'Public press kits' },
    { key: 'logs', label: 'Logs', icon: FileTerminal, description: 'System audit logs' },
    { key: 'applications', label: 'Applications', icon: ClipboardList, description: 'Member applications' },
];
