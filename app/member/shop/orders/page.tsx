import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Package } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export default async function MemberOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/public?error=login_required");

  const orders = await prisma.swagOrder.findMany({
    where: { userEmail: session.user.email },
    orderBy: { createdAt: "desc" },
    include: { item: { select: { name: true, image: true } } },
  });

  return (
    <MemberWrapper>
      <CorePageHeader title="My Orders" description="Track your swag orders." icon={<Package />} backLink="/member/shop" backText="Back to Shop" />

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="p-4 rounded-xl border border-black/5 dark:border-white/5 flex items-center gap-4">
            {o.item.image && <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0"><img src={o.item.image} alt="" className="w-full h-full object-cover" /></div>}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{o.item.name}{o.quantity > 1 ? ` x${o.quantity}` : ""}</h3>
              <div className="text-xs text-zinc-400 mt-1">{new Date(o.createdAt).toLocaleDateString()} &middot; {o.pointsSpent} pts</div>
              {o.trackingNumber && <div className="text-xs text-blue-500 mt-1">Tracking: {o.trackingNumber}</div>}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] || "bg-zinc-100 text-zinc-500"}`}>{o.status}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No orders yet.</p>}
      </div>
    </MemberWrapper>
  );
}
