import React from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CoreWrapper>
            {children}
        </CoreWrapper>
    );
}
