'use client';

import React from 'react';
import { Handshake } from 'lucide-react';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { DataGrid } from '@/components/data-grid/DataGrid';

export default function PartnersPage() {
    return (
        <CoreWrapper>
            <DataGrid 
                tableName="partners"
                title="Partners & Sponsors"
                description="Manage external relationships, sponsors, and vendors."
                icon={<Handshake className="w-5 h-5 text-zinc-200" />}
            />
        </CoreWrapper>
    );
}
