'use client';
import { useEffect, useState } from 'react';

/**
 * Enhanced PWA Analytics
 * Tracks cache performance, response times, and offline usage patterns
 */

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  avgResponseTime: number;
  networkResponseTime: number;
  cacheResponseTime: number;
}

interface OfflineMetrics {
  totalOfflineTime: number; // ms
  offlineSessionsCount: number;
  actionsWhileOffline: number;
  lastOfflineTimestamp: number | null;
}

class PWAAnalytics {
  private static metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRatio: 0,
    avgResponseTime: 0,
    networkResponseTime: 0,
    cacheResponseTime: 0,
  };

  private static offlineMetrics: OfflineMetrics = {
    totalOfflineTime: 0,
    offlineSessionsCount: 0,
    actionsWhileOffline: 0,
    lastOfflineTimestamp: null,
  };

  private static offlineStartTime: number | null = null;
  private static readonly STORAGE_KEY = 'pwa-analytics';

  /**
   * Initialize analytics tracking
   */
  static init() {
    if (typeof window === 'undefined') return;

    // Load persisted metrics
    this.loadMetrics();

    // Track fetch events to measure cache performance
    this.interceptFetch();

    // Track offline/online events
    this.trackOfflineUsage();

    // Periodic reporting (every 5 minutes)
    setInterval(() => this.reportMetrics(), 5 * 60 * 1000);
  }

  /**
   * Intercept fetch to track cache hits/misses and response times
   */
  private static interceptFetch() {
    const originalFetch = window.fetch;

    (window as any).fetch = async (...args: Parameters<typeof fetch>) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Check if response came from cache
        const fromCache = response.headers.get('x-cache') === 'HIT' || 
                         response.type === 'basic' && responseTime < 50;

        if (fromCache) {
          this.metrics.hits++;
          this.metrics.cacheResponseTime = 
            (this.metrics.cacheResponseTime * (this.metrics.hits - 1) + responseTime) / this.metrics.hits;
        } else {
          this.metrics.misses++;
          this.metrics.networkResponseTime = 
            (this.metrics.networkResponseTime * (this.metrics.misses - 1) + responseTime) / this.metrics.misses;
        }

        // Calculate hit ratio
        const total = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRatio = total > 0 ? (this.metrics.hits / total) * 100 : 0;

        // Average response time
        this.metrics.avgResponseTime = 
          (this.metrics.cacheResponseTime * this.metrics.hits + 
           this.metrics.networkResponseTime * this.metrics.misses) / total;

        // Save metrics
        this.saveMetrics();

        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  /**
   * Track offline usage patterns
   */
  private static trackOfflineUsage() {
    // Track going offline
    window.addEventListener('offline', () => {
      this.offlineStartTime = Date.now();
      this.offlineMetrics.offlineSessionsCount++;
      this.offlineMetrics.lastOfflineTimestamp = this.offlineStartTime;

      console.log('📴 Went offline - tracking usage...');
      this.saveMetrics();
    });

    // Track coming back online
    window.addEventListener('online', () => {
      if (this.offlineStartTime) {
        const offlineDuration = Date.now() - this.offlineStartTime;
        this.offlineMetrics.totalOfflineTime += offlineDuration;
        this.offlineStartTime = null;

        console.log(`🌐 Back online - was offline for ${(offlineDuration / 1000).toFixed(1)}s`);
        this.reportOfflineMetrics();
        this.saveMetrics();
      }
    });

    // Track actions while offline
    if (!navigator.onLine) {
      this.offlineStartTime = Date.now();
      
      // Track clicks/interactions while offline
      document.addEventListener('click', () => {
        if (!navigator.onLine) {
          this.offlineMetrics.actionsWhileOffline++;
          this.saveMetrics();
        }
      });
    }
  }

  /**
   * Report metrics to analytics platform
   */
  private static reportMetrics() {
    const metrics = this.getMetrics();

    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'pwa_cache_performance', {
        event_category: 'PWA',
        cache_hit_ratio: metrics.cache.hitRatio.toFixed(1),
        avg_response_time: metrics.cache.avgResponseTime.toFixed(0),
        cache_response_time: metrics.cache.cacheResponseTime.toFixed(0),
        network_response_time: metrics.cache.networkResponseTime.toFixed(0),
        total_requests: metrics.cache.hits + metrics.cache.misses,
      });
    }

    console.log('📊 PWA Analytics:', metrics);
  }

  /**
   * Report offline metrics
   */
  private static reportOfflineMetrics() {
    const offline = this.offlineMetrics;

    if ((window as any).gtag) {
      (window as any).gtag('event', 'pwa_offline_usage', {
        event_category: 'PWA',
        total_offline_time_seconds: (offline.totalOfflineTime / 1000).toFixed(0),
        offline_sessions: offline.offlineSessionsCount,
        actions_while_offline: offline.actionsWhileOffline,
      });
    }
  }

  /**
   * Get current metrics
   */
  static getMetrics() {
    return {
      cache: { ...this.metrics },
      offline: { ...this.offlineMetrics },
    };
  }

  /**
   * Save metrics to localStorage
   */
  private static saveMetrics() {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          cache: this.metrics,
          offline: this.offlineMetrics,
        })
      );
    } catch (e) {
      console.warn('Failed to save PWA analytics:', e);
    }
  }

  /**
   * Load metrics from localStorage
   */
  private static loadMetrics() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.metrics = { ...this.metrics, ...data.cache };
        this.offlineMetrics = { ...this.offlineMetrics, ...data.offline };
      }
    } catch (e) {
      console.warn('Failed to load PWA analytics:', e);
    }
  }

  /**
   * Reset all metrics
   */
  static reset() {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      avgResponseTime: 0,
      networkResponseTime: 0,
      cacheResponseTime: 0,
    };
    this.offlineMetrics = {
      totalOfflineTime: 0,
      offlineSessionsCount: 0,
      actionsWhileOffline: 0,
      lastOfflineTimestamp: null,
    };
    this.saveMetrics();
  }
}

/**
 * React Hook for PWA Analytics
 */
export function usePWAAnalytics() {
  const [metrics, setMetrics] = useState(() => PWAAnalytics.getMetrics());

  useEffect(() => {
    // Initialize analytics
    PWAAnalytics.init();

    // Update metrics every 10 seconds
    const interval = setInterval(() => {
      setMetrics(PWAAnalytics.getMetrics());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    reset: () => {
      PWAAnalytics.reset();
      setMetrics(PWAAnalytics.getMetrics());
    },
  };
}

export default PWAAnalytics;
