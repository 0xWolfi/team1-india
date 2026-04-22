"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  LayoutGrid,
  List,
  MapPin,
  Search,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortOrder = "newest" | "oldest";

function TimeAgo({ date }: { date: Date | string }) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  let text = "";
  if (diff < 60) text = "just now";
  else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
  else if (diff < 86400) text = `${Math.floor(diff / 3600)}h ago`;
  else text = `${Math.floor(diff / 86400)}d ago`;

  return <span>{text}</span>;
}

function getEventStatus(date: string | Date | undefined) {
  if (!date) return null;
  const eventDate = new Date(date);
  const now = new Date();
  if (eventDate.getTime() > now.getTime()) return "Upcoming";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function EventsClient({ events }: { events: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    const searched = events.filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return searched.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [events, searchTerm, sortOrder]);

  return (
    <div>
      {/* Search & Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-black dark:text-white",
              "placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none transition-all duration-300",
              "bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10",
              "focus:border-black/20 dark:focus:border-white/20 focus:bg-black/[0.07] dark:focus:bg-white/[0.07]",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300",
                "bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20",
                "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
            </button>

            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSortOpen(false)}
                />
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 z-50 w-44 py-1.5 rounded-xl overflow-hidden",
                    "bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/10",
                    "shadow-2xl shadow-black/40"
                  )}
                >
                  <button
                    onClick={() => {
                      setSortOrder("newest");
                      setSortOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-medium transition-colors",
                      sortOrder === "newest"
                        ? "text-black dark:text-white bg-black/10 dark:bg-white/10"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder("oldest");
                      setSortOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-medium transition-colors",
                      sortOrder === "oldest"
                        ? "text-black dark:text-white bg-black/10 dark:bg-white/10"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    Oldest First
                  </button>
                </div>
              </>
            )}
          </div>

          {/* View Toggle */}
          <div
            className={cn(
              "flex items-center rounded-xl p-1",
              "bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
            )}
          >
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-300",
                viewMode === "grid"
                  ? "bg-zinc-700 text-black dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-300",
                viewMode === "list"
                  ? "bg-zinc-700 text-black dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid / List */}
      {filteredEvents.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-5"
          }
        >
          {filteredEvents.map((item: any) => {
            const status = getEventStatus(item.date);

            return viewMode === "grid" ? (
              /* ───── Grid Card ───── */
              <Link
                key={item.id}
                href={`/public/events/${item.id}`}
                className={cn(
                  "group relative flex flex-col rounded-2xl overflow-hidden",
                  "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/6 dark:border-white/6",
                  "hover:-translate-y-1 hover:border-black/10 dark:hover:border-white/10 hover:shadow-xl hover:shadow-black/20",
                  "transition-all duration-300"
                )}
              >
                {/* Image */}
                <div className="relative w-full h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80">
                      <div className="p-4 rounded-full bg-black/5 dark:bg-white/5">
                        <Calendar className="w-8 h-8 text-zinc-700" />
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent pointer-events-none" />

                  {/* Status badge */}
                  {status && (
                    <div className="absolute top-3.5 right-3.5">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          "bg-black/60 backdrop-blur-md border border-white/10 text-white"
                        )}
                      >
                        <Calendar className="w-3 h-3" />
                        {status}
                      </span>
                    </div>
                  )}

                  {/* Date at bottom-left over gradient */}
                  {item.date && (
                    <div className="absolute bottom-3.5 left-4">
                      <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-black dark:text-white text-base leading-snug line-clamp-2 mb-2">
                      {item.title}
                    </h3>

                    {item.location && (
                      <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium mb-2.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-black/6 dark:border-white/6 pt-4">
                    <span>
                      by{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {item.createdBy?.name || "Team 1"}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-300">
                      <TimeAgo date={item.createdAt} />
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              /* ───── List Card ───── */
              <Link
                key={item.id}
                href={`/public/events/${item.id}`}
                className={cn(
                  "group flex flex-col sm:flex-row rounded-2xl overflow-hidden",
                  "bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/6 dark:border-white/6",
                  "hover:-translate-y-0.5 hover:border-black/10 dark:hover:border-white/10 hover:shadow-xl hover:shadow-black/20",
                  "transition-all duration-300"
                )}
              >
                {/* Image */}
                <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80">
                      <div className="p-3 rounded-full bg-black/5 dark:bg-white/5">
                        <Calendar className="w-6 h-6 text-zinc-700" />
                      </div>
                    </div>
                  )}

                  {/* Status badge */}
                  {status && (
                    <div className="absolute top-3 right-3 sm:top-3 sm:left-3 sm:right-auto">
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          "bg-black/60 backdrop-blur-md border border-white/10 text-white"
                        )}
                      >
                        {status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-black dark:text-white text-base leading-snug line-clamp-1 flex-1">
                        {item.title}
                      </h3>
                      <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-300 whitespace-nowrap">
                        View
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-2.5">
                      {item.date && (
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 border-t border-black/6 dark:border-white/6 pt-3">
                    <span>
                      by{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {item.createdBy?.name || "Team 1"}
                      </span>
                    </span>
                    <TimeAgo date={item.createdAt} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ───── Empty State ───── */
        <div
          className={cn(
            "py-28 flex flex-col items-center justify-center rounded-2xl",
            "border border-dashed border-black/8 dark:border-white/8",
            "bg-zinc-100/20 dark:bg-zinc-900/20 backdrop-blur-sm"
          )}
        >
          <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 mb-5">
            <Calendar className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">
            No events found
          </p>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Events will appear here when created"}
          </p>
        </div>
      )}
    </div>
  );
}
