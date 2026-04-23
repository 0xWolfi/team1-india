"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Coins, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

export default function ProfileWalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/wallet").then((r) => r.json()).then((d) => setWallet(d.wallet));
    fetch("/api/wallet/history").then((r) => r.json()).then((d) => setTransactions(d.transactions || []));
    fetch("/api/wallet/expiring").then((r) => r.json()).then((d) => setExpiring(d.expiring || []));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <FloatingNav />
      <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <Link href="/public/profile" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <h1 className="text-3xl font-bold mb-8">My Wallet</h1>

        {wallet && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total XP", value: wallet.totalXp, icon: TrendingUp, color: "text-purple-500" },
              { label: "Points Balance", value: wallet.pointsBalance, icon: Coins, color: "text-yellow-500" },
              { label: "Total Earned", value: wallet.totalEarned, icon: TrendingUp, color: "text-green-500" },
              { label: "Total Spent", value: wallet.totalSpent, icon: Coins, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {expiring.length > 0 && (
          <div className="mb-8 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-yellow-500" /><span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">Points Expiring Soon</span></div>
            {expiring.map((b: any) => (
              <div key={b.id} className="flex justify-between text-sm py-1">
                <span className="text-zinc-600 dark:text-zinc-400">{b.remaining} points from {b.source}</span>
                <span className="text-zinc-400">{new Date(b.expiresAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Transaction History</h2>
        <div className="space-y-2">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/5">
              <div>
                <div className="text-sm font-medium">{tx.description || tx.type}</div>
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
      </div>
      <Footer />
    </div>
  );
}
