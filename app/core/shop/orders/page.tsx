"use client";

import { useEffect, useState } from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Package } from "lucide-react";

const STATUS_COLORS: Record<string, string> = { pending: "bg-yellow-500/10 text-yellow-500", processing: "bg-blue-500/10 text-blue-500", shipped: "bg-purple-500/10 text-purple-500", delivered: "bg-green-500/10 text-green-500", cancelled: "bg-red-500/10 text-red-500" };

export default function CoreOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { fetch("/api/swag/orders").then((r) => r.json()).then((d) => setOrders(d.orders || [])); }, []);

  return (
    <CoreWrapper>
      <CorePageHeader title="Swag Orders" description={`${orders.length} total orders`} icon={<Package />} backLink="/core/shop" backText="Back to Shop" />
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o.id} className="flex items-center justify-between p-4 rounded-xl border border-black/5 dark:border-white/5">
            <div>
              <h3 className="font-bold text-sm">{o.item?.name}{o.quantity > 1 ? ` x${o.quantity}` : ""}</h3>
              <div className="text-xs text-zinc-400 mt-1">{o.userEmail} &middot; {new Date(o.createdAt).toLocaleDateString()} &middot; {o.pointsSpent} pts</div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No orders yet.</p>}
      </div>
    </CoreWrapper>
  );
}
