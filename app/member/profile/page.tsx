"use client";

import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { MemberWrapper } from "@/components/member/MemberWrapper";

export default function ProfilePage() {
    return (
        <MemberWrapper>
            <ProfileEditor backHref="/member" backLabel="Back to Dashboard" />
        </MemberWrapper>
    );
}
