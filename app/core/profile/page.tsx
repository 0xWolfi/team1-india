import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { MemberProfileClient } from "@/components/member/MemberProfileClient";
import Link from "next/link";

export default async function CoreProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) redirect("/core");

    const role = (session.user as { role?: string })?.role;
    if (role !== "CORE") {
        if (role === "MEMBER") redirect("/member");
        if (role === "PUBLIC") redirect("/public");
        redirect("/core");
    }

    return (
        <CoreWrapper>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Link href="/core" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors mb-6 group text-sm font-medium">
                    <span aria-hidden="true">←</span>
                    <span>Back to Core</span>
                </Link>
                <MemberProfileClient role="CORE" />
            </div>
        </CoreWrapper>
    );
}
