"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, X, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Fetch on mount and every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const dismissNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
      return wasUnread ? prev - 1 : prev;
    });
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        title="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
            <span className="text-sm font-bold text-black dark:text-white">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[360px] divide-y divide-black/5 dark:divide-white/5">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 flex gap-3 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors",
                    !n.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  {/* Unread dot */}
                  <div className="pt-1.5 shrink-0">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        n.isRead
                          ? "bg-transparent"
                          : "bg-blue-500"
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-black dark:text-white truncate">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                      {n.message}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-400">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setOpen(false)}
                          className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                        >
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-400 hover:text-red-500 transition-all"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
