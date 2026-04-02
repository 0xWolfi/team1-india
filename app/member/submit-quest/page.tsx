import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { SubmitQuestForm } from "@/components/member/SubmitQuestForm";

export default async function SubmitQuestPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/member");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (session.user as any)?.role;
    if (role !== "MEMBER" && role !== "CORE") {
        redirect("/public?error=access_denied");
    }

    return (
        <MemberWrapper>
            <SubmitQuestForm user={session.user} />
        </MemberWrapper>
    );
}
