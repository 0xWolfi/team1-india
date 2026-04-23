import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Wallet, TrendingUp, Coins, Clock } from "lucide-react";

export default async function MemberWalletPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/public?error=login_required");
  const role = (session.user as any)?.role;
  if (role !== "MEMBER" && role !== "CORE") redirect("/public?error=access_denied");

  const [wallet, transactions, expiring, rank] = await Promise.all([
    prisma.userWallet.findUnique({ where: { userEmail: session.user.email } }),
    prisma.walletTransaction.findMany({
      where: { wallet: { userEmail: session.user.email } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.pointsBatch.findMany({
      where: { wallet: { userEmail: session.user.email }, remaining: { gt: 0 }, expiresAt: { gt: new Date(), lte: new Date(Date.now() + 7 * 86400000) } },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.userWallet.findUnique({ where: { userEmail: session.user.email }, select: { totalXp: true } })
      .then((w) => w ? prisma.userWallet.count({ where: { totalXp: { gt: w.totalXp } } }).then((c) => c + 1) : null),
  ]);

  return (
    <MemberWrapper>
      <CorePageHeader title="My Wallet" description="Your XP, points, and transaction history." icon={<Wallet />} backLink="/member" backText="Back to Dashboard" />

      {wallet && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total XP", value: wallet.totalXp.toLocaleString(), icon: TrendingUp, color: "text-purple-500" },
            { label: "Points", value: wallet.pointsBalance.toLocaleString(), icon: Coins, color: "text-yellow-500" },
            { label: "Rank", value: rank ? `#${rank}` : "—", icon: TrendingUp, color: "text-blue-500" },
            { label: "Earned", value: wallet.totalEarned.toLocaleString(), icon: Coins, color: "text-green-500" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {expiring.length > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-yellow-500" /><span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">Expiring Soon</span></div>
          {expiring.map((b) => (
            <div key={b.id} className="flex justify-between text-sm py-1">
              <span className="text-zinc-600 dark:text-zinc-400">{b.remaining} points</span>
              <span className="text-zinc-400">{new Date(b.expiresAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Recent Transactions</h2>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/5">
            <div>
              <div className="text-sm font-medium">{tx.description || tx.type.replace(/_/g, " ")}</div>
              <div className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              {tx.xpAmount > 0 && <div className="text-xs text-purple-500 font-medium">+{tx.xpAmount} XP</div>}
              <div className={`text-sm font-bold ${tx.pointsAmount >= 0 ? "text-green-500" : "text-red-500"}`}>
                {tx.pointsAmount >= 0 ? "+" : ""}{tx.pointsAmount} pts
              </div>
            </div>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-zinc-400 text-sm text-center py-10">No transactions yet.</p>}
      </div>
    </MemberWrapper>
  );
}
