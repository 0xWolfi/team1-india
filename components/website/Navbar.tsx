import Link from "next/link";
import { MotionIcon } from "motion-icons-react";
import { Team1Logo } from "@/components/Team1Logo";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-transparent border-b border-white/10">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Team1Logo className="h-6 w-24" />
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
      </div>

      <div className="flex items-center gap-4">
        <Link href="/access-check" className="text-sm text-zinc-400 hover:text-white transition-colors">
          <MotionIcon name="User" className="w-5 h-5" />
        </Link>
        <Link href="/public" className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors">
          Guidebook
        </Link>
      </div>
    </nav>
  );
}
