"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Globe,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Playbook {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  createdBy: {
    name: string | null;
  } | null;
}

function timeAgo(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

interface PlaybooksClientProps {
  playbooks: Playbook[];
}

export default function PlaybooksClient({ playbooks }: PlaybooksClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredPlaybooks = playbooks.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
          <input
            type="text"
            placeholder="Search playbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
              "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]",
              "focus:outline-none focus:border-black/[0.12] dark:focus:border-white/[0.12] focus:bg-zinc-100/60 dark:focus:bg-zinc-900/60",
              "transition-all duration-300"
            )}
          />
        </div>

        {/* View Toggle */}
        <div
          className={cn(
            "flex items-center rounded-xl p-1 shrink-0 self-end sm:self-auto",
            "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]"
          )}
        >
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              viewMode === "grid"
                ? "bg-black/[0.08] dark:bg-white/[0.08] text-black dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              viewMode === "list"
                ? "bg-black/[0.08] dark:bg-white/[0.08] text-black dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playbooks Grid */}
      {filteredPlaybooks.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              : "flex flex-col gap-4"
          }
        >
          {filteredPlaybooks.map((playbook) =>
            viewMode === "grid" ? (
              <GridCard key={playbook.id} playbook={playbook} />
            ) : (
              <ListCard key={playbook.id} playbook={playbook} />
            )
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-2xl">
          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] mb-4">
            <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm font-medium">
            {searchTerm
              ? "No playbooks match your search."
              : "No playbooks found."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Grid Card ──────────────────────────────────────────────── */

function GridCard({ playbook }: { playbook: Playbook }) {
  const isPublic = playbook.visibility?.toUpperCase() === "PUBLIC";

  return (
    <Link
      href={`/public/playbooks/${playbook.id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden",
        "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]",
        "hover:-translate-y-1 hover:border-black/10 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-black/20",
        "transition-all duration-300 ease-out"
      )}
    >
      {/* Cover Image */}
      <div className="relative w-full h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {playbook.coverImage ? (
          <Image
            src={playbook.coverImage}
            alt={playbook.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
              <BookOpen className="w-8 h-8 text-zinc-700" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

        {/* Visibility Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider",
              "backdrop-blur-md border",
              isPublic
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            )}
          >
            {isPublic ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            {isPublic ? "Public" : "Member"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5">
        <h3 className="text-black dark:text-white font-semibold text-[15px] leading-snug line-clamp-2 mb-2">
          {playbook.title}
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
          {playbook.description || "No description provided."}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
            <span>
              by{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                {playbook.createdBy?.name || "Team 1"}
              </span>
            </span>
            <span className="text-zinc-700">·</span>
            <span>{timeAgo(playbook.createdAt)}</span>
          </div>

          {/* Read Action */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors duration-200">
            READ
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── List Card ──────────────────────────────────────────────── */

function ListCard({ playbook }: { playbook: Playbook }) {
  const isPublic = playbook.visibility?.toUpperCase() === "PUBLIC";

  return (
    <Link
      href={`/public/playbooks/${playbook.id}`}
      className={cn(
        "group relative flex flex-col sm:flex-row rounded-2xl overflow-hidden",
        "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.06]",
        "hover:-translate-y-0.5 hover:border-black/10 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-black/20",
        "transition-all duration-300 ease-out"
      )}
    >
      {/* Cover Image */}
      <div className="relative w-full sm:w-56 h-40 sm:h-auto shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {playbook.coverImage ? (
          <Image
            src={playbook.coverImage}
            alt={playbook.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 100vw, 224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center min-h-[120px]">
            <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
              <BookOpen className="w-6 h-6 text-zinc-700" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-950/40 hidden sm:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent sm:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-black dark:text-white font-semibold text-[15px] leading-snug line-clamp-2 flex-1">
              {playbook.title}
            </h3>

            {/* Visibility Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider shrink-0",
                "backdrop-blur-md border",
                isPublic
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}
            >
              {isPublic ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {isPublic ? "Public" : "Member"}
            </span>
          </div>

          <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">
            {playbook.description || "No description provided."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
            <span>
              by{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                {playbook.createdBy?.name || "Team 1"}
              </span>
            </span>
            <span className="text-zinc-700">·</span>
            <span>{timeAgo(playbook.createdAt)}</span>
          </div>

          {/* Read Action */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors duration-200">
            READ
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </Link>
  );
}
