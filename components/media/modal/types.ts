export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: { email: string };
}

export interface MediaItem {
    id?: string;
    title: string;
    description: string;
    platform: string[];
    links: string[];
    status?: string;
    comments?: Comment[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditLogs?: any[];
}
