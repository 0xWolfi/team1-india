'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { DataGrid } from '@/components/data-grid/DataGrid';

export default function MembersPage() {
    return (
        <CoreWrapper>
            <DataGrid 
                tableName="members"
                title="Members Database"
                description="Manage community members, roles, and profiles."
                icon={<Users className="w-5 h-5 text-zinc-200" />}
            />
        </CoreWrapper>
    );
}
