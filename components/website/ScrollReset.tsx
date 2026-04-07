"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    // Immediate reset
    window.scrollTo(0, 0);
    // Also reset after Next.js finishes any deferred scroll restoration
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    const timeout = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}
