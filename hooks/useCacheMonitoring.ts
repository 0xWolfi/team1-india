'use client';
import { useEffect, useState } from 'react';

// Extend Window type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface CacheStats {
  usage: number;
  quota: number;
  percentage: number;
  caches: { name: string; size: number }[];
}

export function useCacheMonitoring() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    const checkCacheQuota = async () => {
      try {
        // Get storage quota
        if (navigator.storage && navigator.storage.estimate) {
          const { usage = 0, quota = 0 } = await navigator.storage.estimate();
          const percentage = quota > 0 ? (usage / quota) * 100 : 0;

          // Get cache sizes
          const cacheNames = await caches.keys();
          const cacheSizes = await Promise.all(
            cacheNames.map(async (name) => {
              const cache = await caches.open(name);
              const keys = await cache.keys();
              return { name, size: keys.length };
            })
          );

          const newStats = {
            usage,
            quota,
            percentage,
            caches: cacheSizes,
          };

          setStats(newStats);
          setWarning(percentage > 90);

          // Log warning if quota > 90%
          if (percentage > 90) {
            console.warn(
              `⚠️ Cache quota at ${percentage.toFixed(1)}% (${(usage / 1024 / 1024).toFixed(1)}MB / ${(quota / 1024 / 1024).toFixed(1)}MB)`
            );
          }

          // Track analytics
          if ((window as any).gtag) {
            (window as any).gtag('event', 'cache_quota_check', {
              usage_mb: (usage / 1024 / 1024).toFixed(1),
              quota_mb: (quota / 1024 / 1024).toFixed(1),
              percentage: percentage.toFixed(1),
            });
          }
        }
      } catch (error) {
        console.error('Cache monitoring error:', error);
      }
    };

    // Check on mount
    checkCacheQuota();

    // Check periodically (every 5 minutes)
    const interval = setInterval(checkCacheQuota, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { stats, warning };
}

// Cache Analytics Hook
export function useCacheAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    const trackCacheEvent = (eventName: string, data?: Record<string, any>) => {
      // Track to analytics (Google Analytics, Vercel Analytics, etc.)
      if ((window as any).gtag) {
        (window as any).gtag('event', eventName, {
          event_category: 'PWA',
          ...data,
        });
      }
    };

    // Track service worker installation
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        trackCacheEvent('service_worker_ready');
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        trackCacheEvent('service_worker_updated');
      });
    }

    // Track app installation
    window.addEventListener('appinstalled', () => {
      trackCacheEvent('app_installed');
    });

    // Track offline/online events
    window.addEventListener('offline', () => {
      trackCacheEvent('went_offline');
    });

    window.addEventListener('online', () => {
      trackCacheEvent('went_online');
    });
  }, []);
}
