import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { MemberWrapper } from "@/components/member/MemberWrapper";
// import { BountyBoard } from "@/components/member/BountyBoard";
import { Zap } from "lucide-react";

export default async function MemberBountyPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/member");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (session.user as any)?.role;
    if (role !== 'MEMBER' && role !== 'CORE') {
        redirect('/public?error=access_denied');
    }

    return (
        <MemberWrapper>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                    <Zap className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Bounty Board</h1>
                <p className="text-zinc-500 text-sm max-w-md">Coming Soon — We are preparing exciting bounties for the community. Stay tuned!</p>
            </div>
        </MemberWrapper>
    );
}
