'use client';
import { useCacheMonitoring, useCacheAnalytics } from '@/hooks/useCacheMonitoring';
import { useEffect, useState } from 'react';

export function CacheMonitoringPanel() {
  const { stats, warning } = useCacheMonitoring();
  useCacheAnalytics();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development or for admins
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsOpen(true);
    }
  }, []);

  if (!stats || !isOpen) return null;

  const usageMB = (stats.usage / 1024 / 1024).toFixed(1);
  const quotaMB = (stats.quota / 1024 / 1024).toFixed(1);

  return (
    <div className="fixed bottom-20 left-4 z-40 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-xs font-mono max-w-xs shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${warning ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="font-bold text-white">Cache Monitor</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Storage Usage */}
      <div className="mb-3">
        <div className="flex justify-between text-zinc-400 mb-1">
          <span>Storage</span>
          <span className={warning ? 'text-red-400 font-bold' : 'text-white'}>
            {stats.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${
              warning ? 'bg-red-500' : stats.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(stats.percentage, 100)}%` }}
          />
        </div>
        <div className="text-zinc-500 mt-1">
          {usageMB}MB / {quotaMB}MB
        </div>
      </div>

      {/* Cache Entries */}
      <div className="space-y-1">
        <div className="text-zinc-500 font-bold mb-2">Caches:</div>
        {stats.caches.map((cache) => (
          <div key={cache.name} className="flex justify-between text-zinc-400">
            <span className="truncate mr-2">{cache.name}</span>
            <span className="text-white">{cache.size}</span>
          </div>
        ))}
      </div>

      {warning && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px]">
          ⚠️ Cache quota {'>'} 90%. Consider clearing old caches.
        </div>
      )}
    </div>
  );
}
