import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { MemberProfileClient } from "@/components/member/MemberProfileClient";

export default async function MemberProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) redirect("/member");

    const role = (session.user as { role?: string })?.role;
    if (role !== "MEMBER") {
        if (role === "CORE") redirect("/core");
        if (role === "PUBLIC") redirect("/public");
        redirect("/member");
    }

    return (
        <MemberWrapper>
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white">My Profile</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage your profile information and preferences</p>
                </div>
                <MemberProfileClient role="MEMBER" />
            </div>
        </MemberWrapper>
    );
}
