'use client';
import { usePWAAnalytics } from '@/lib/pwaAnalytics';

/**
 * Analytics Dashboard Panel
 * Shows real-time PWA performance metrics in development
 */
export function AnalyticsDashboard() {
  const { metrics, reset } = usePWAAnalytics();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { cache, offline } = metrics;
  const totalRequests = cache.hits + cache.misses;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-xs font-mono max-w-sm shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-bold text-white">PWA Analytics</span>
        </div>
        <button
          onClick={reset}
          className="text-zinc-500 hover:text-white transition text-[10px]"
        >
          Reset
        </button>
      </div>

      {/* Cache Performance */}
      <div className="mb-4">
        <div className="text-zinc-500 font-bold mb-2">Cache Performance</div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-400">Hit Ratio</span>
            <span className={`font-bold ${cache.hitRatio > 70 ? 'text-green-400' : cache.hitRatio > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {cache.hitRatio.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Hits / Misses</span>
            <span className="text-white">
              {cache.hits} / {cache.misses}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Avg Response</span>
            <span className="text-white">
              {cache.avgResponseTime.toFixed(0)}ms
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
            <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
              <div className="text-green-400 mb-1">Cache</div>
              <div className="text-white font-bold">{cache.cacheResponseTime.toFixed(0)}ms</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <div className="text-blue-400 mb-1">Network</div>
              <div className="text-white font-bold">{cache.networkResponseTime.toFixed(0)}ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Usage */}
      <div>
        <div className="text-zinc-500 font-bold mb-2">Offline Usage</div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-400">Sessions</span>
            <span className="text-white">{offline.offlineSessionsCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Total Time</span>
            <span className="text-white">
              {(offline.totalOfflineTime / 1000).toFixed(0)}s
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Actions</span>
            <span className="text-white">{offline.actionsWhileOffline}</span>
          </div>
        </div>
      </div>

      {totalRequests > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-zinc-500">
          {totalRequests} total requests tracked
        </div>
      )}
    </div>
  );
}
