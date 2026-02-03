import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { MemberProfileClient } from "@/components/member/MemberProfileClient";
import Link from "next/link";

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
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Link href="/member" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 group text-sm font-medium">
                    <span aria-hidden="true">←</span>
                    <span>Back to Dashboard</span>
                </Link>
                <MemberProfileClient role="MEMBER" />
            </div>
        </MemberWrapper>
    );
}
