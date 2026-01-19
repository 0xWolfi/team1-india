import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { CoreWrapper } from "@/components/core/CoreWrapper";

export default function CoreProfilePage() {
    return (
        <CoreWrapper>
            <ProfileEditor backHref="/core" backLabel="Back to Core" />
        </CoreWrapper>
    );
}
