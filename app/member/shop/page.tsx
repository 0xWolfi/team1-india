import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ShoppingBag, Coins } from "lucide-react";
import Link from "next/link";

export default async function MemberShopPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/public?error=login_required");
  const role = (session.user as any)?.role;
  if (role !== "MEMBER" && role !== "CORE") redirect("/public?error=access_denied");

  const [items, wallet] = await Promise.all([
    prisma.swagItem.findMany({
      where: { status: "active", deletedAt: null, audience: { in: ["all", "member"] } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { variants: { select: { id: true, label: true, stock: true } } },
    }),
    prisma.userWallet.findUnique({ where: { userEmail: session.user.email }, select: { pointsBalance: true } }),
  ]);

  return (
    <MemberWrapper>
      <CorePageHeader title="Swag Shop" description="Redeem your points for exclusive Team1 merch." icon={<ShoppingBag />} backLink="/member" backText="Back to Dashboard">
        <Link href="/member/shop/orders" className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">My Orders</Link>
      </CorePageHeader>

      {wallet && (
        <div className="mb-8 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center gap-3">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-sm">Your balance: <strong className="text-lg">{wallet.pointsBalance.toLocaleString()}</strong> points</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-black/5 dark:border-white/5 overflow-hidden hover:border-black/10 dark:hover:border-white/10 transition-colors">
            {item.image && <div className="h-48 bg-zinc-100 dark:bg-zinc-800"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold">{item.name}</h3>
                {item.featured && <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-[10px] font-bold text-yellow-500">Featured</span>}
              </div>
              {item.description && <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-yellow-500">{item.pointsCost} pts</span>
                <span className="text-xs text-zinc-400">{item.remainingStock} left</span>
              </div>
              {item.variants.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">{item.variants.map((v) => <span key={v.id} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500">{v.label}</span>)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No items available yet. Check back soon!</p>}
    </MemberWrapper>
  );
}
