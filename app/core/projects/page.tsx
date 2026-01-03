'use client';

import React from 'react';
import { FolderKanban } from 'lucide-react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { DataGrid } from '@/components/data-grid/DataGrid';

export default function ProjectsPage() {
    return (
        <CoreWrapper>
            <DataGrid 
                tableName="projects"
                title="Projects"
                description="Track project status, custom fields, and assignments."
                icon={<FolderKanban className="w-5 h-5 text-zinc-200" />}
            />
        </CoreWrapper>
    );
}
