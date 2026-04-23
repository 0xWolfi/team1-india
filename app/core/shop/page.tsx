"use client";

import { useEffect, useState } from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { ShoppingBag, Plus, Package } from "lucide-react";
import Link from "next/link";

export default function CoreShopPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fetch("/api/swag").then((r) => r.json()).then((d) => setItems(d.items || [])); }, []);

  return (
    <CoreWrapper>
      <CorePageHeader title="Swag Shop" description="Manage swag items and orders." icon={<ShoppingBag />}>
        <Link href="/core/shop/orders" className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"><Package className="w-4 h-4" />Orders</Link>
        <Link href="/core/shop/new" className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 flex items-center gap-2"><Plus className="w-4 h-4" />New Item</Link>
      </CorePageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
            {item.image && <div className="h-40 bg-zinc-100 dark:bg-zinc-800"><img src={item.image} alt="" className="w-full h-full object-cover" /></div>}
            <div className="p-4">
              <h3 className="font-bold mb-1">{item.name}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-500 font-bold">{item.pointsCost} pts</span>
                <span className="text-zinc-400 text-xs">{item.remainingStock}/{item.totalStock} stock</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">{item._count?.orders || 0} orders · {item.status}</div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No items yet.</p>}
    </CoreWrapper>
  );
}
