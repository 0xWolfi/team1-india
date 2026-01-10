// Shared Types for Team1India Public Pages

export interface FormField {
    id: string;
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'url' | 'tel';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

export interface KPI {
    label: string;
    value: string;
    color?: string;
}

export interface TimelineItem {
    step: string;
    duration: string;
}

export interface GuideBody {
    description: string;
    kpis?: KPI[];
    timeline?: TimelineItem[];
    rules?: string[];
    date?: string | Date;     // Added
    location?: string;        // Added
}

// Base interface for common fields
export interface BaseGuide {
    id: string;
    title: string;
    coverImage?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    visibility: 'PUBLIC' | 'MEMBER' | 'CORE';
    createdById?: string | null;
    createdBy?: {             // Added relation
        name?: string | null;
        email?: string | null;
    } | null;
    formSchema?: FormField[] | any; // Added to base as it's common
}

export interface Guide extends BaseGuide {
    type: string;
    body: GuideBody;
}

export interface Program extends BaseGuide {
    type: "PROGRAM";
    status: string;
    description?: string | null;
    body?: GuideBody; // Added to allow accessing body props
    customFields?: {
        coverImage?: string;
        kpis?: KPI[];
        timeline?: TimelineItem[];
    } | any;
}

export interface Event extends BaseGuide {
    type: "EVENT";
    date?: string | Date | null;
    location?: string | null;
    status: string;
    description?: string | null;
    body?: GuideBody; // Added
    customFields?: {
        coverImage?: string;
    } | any;
}
