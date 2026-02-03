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
    { key: 'playbooks', label: 'Playbooks', iconName: 'FileText', description: 'Manage strategy docs' },
    { key: 'operations', label: 'Operations', iconName: 'Briefcase', description: 'Operational workflows' },
    { key: 'media', label: 'Media', iconName: 'Image', description: 'Photo & Video assets' },
    { key: 'events', label: 'Event Guide', iconName: 'Calendar', description: 'Event planning & guides' },
    { key: 'programs', label: 'Program Guide', iconName: 'BookOpen', description: 'Educational programs' },
    { key: 'content', label: 'Content', iconName: 'Layers', description: 'General content management' },
    { key: 'members', label: 'Members Details', iconName: 'UserCheck', description: 'User data & protocols' },
    { key: 'projects', label: 'Projects', iconName: 'FolderKanban', description: 'Project tracking' },
    { key: 'partners', label: 'Partners', iconName: 'Handshake', description: 'Partner relationships' },
    { key: 'experiments', label: 'Experiments', iconName: 'FlaskConical', description: 'R&D and testing' },
    { key: 'mediakit', label: 'Mediakit', iconName: 'Newspaper', description: 'Public press kits' },
    { key: 'logs', label: 'Logs', iconName: 'FileTerminal', description: 'System audit logs' },
    { key: 'applications', label: 'Applications', iconName: 'ClipboardList', description: 'Member applications' },
];
