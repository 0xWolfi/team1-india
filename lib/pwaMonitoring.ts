/**
 * PWA Production Monitoring
 * Sentry integration, cache corruption detection, quota exhaustion alerts
 */

import { sendAlert } from './alertNotifications';
import { HealthReportGenerator } from './healthReports';

interface MonitoringConfig {
  sentryDSN?: string;
  enableCacheCorruptionDetection: boolean;
  quotaWarningThreshold: number; // percentage
  quotaCriticalThreshold: number; // percentage
  adminDashboardEndpoint?: string;
}

interface ErrorReport {
  type: 'sw_error' | 'cache_corruption' | 'quota_exhaustion';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  details: any;
  timestamp: number;
  userAgent?: string;
}

class PWAMonitoring {
  private static config: MonitoringConfig = {
    enableCacheCorruptionDetection: true,
    quotaWarningThreshold: 85,
    quotaCriticalThreshold: 95,
  };

  /**
   * Initialize monitoring
   */
  static init(config?: Partial<MonitoringConfig>) {
    if (typeof window === 'undefined') return;

    this.config = { ...this.config, ...config };

    // Monitor service worker errors
    this.monitorServiceWorkerErrors();

    // Detect cache corruption
    if (this.config.enableCacheCorruptionDetection) {
      this.detectCacheCorruption();
    }

    // Monitor quota exhaustion
    this.monitorCacheQuota();

    console.log('🔍 PWA Production Monitoring: Active');
  }

  /**
   * Monitor Service Worker errors and report to Sentry
   */
  private static monitorServiceWorkerErrors() {
    if (!('serviceWorker' in navigator)) return;

    // Monitor SW registration errors
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      this.reportError({
        type: 'sw_error',
        severity: 'critical',
        message: 'Service Worker registration failed',
        details: {
          error: error.message,
          stack: error.stack,
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    });

    // Monitor SW controller errors
    navigator.serviceWorker.addEventListener('error', (event) => {
      this.reportError({
        type: 'sw_error',
        severity: 'error',
        message: 'Service Worker runtime error',
        details: {
          error: event,
        },
        timestamp: Date.now(),
      });
    });

    // Monitor SW update errors
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('error', (event) => {
            this.reportError({
              type: 'sw_error',
              severity: 'error',
              message: 'Service Worker update error',
              details: {
                state: newWorker.state,
                error: event,
              },
              timestamp: Date.now(),
            });
          });
        }
      });
    });
  }

  /**
   * Detect cache corruption by validating cache integrity
   */
  private static async detectCacheCorruption() {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        // Check for corrupted entries
        for (const request of keys) {
          try {
            const response = await cache.match(request);
            
            if (!response) {
              // Cache entry exists but can't be retrieved - corrupted
              this.reportError({
                type: 'cache_corruption',
                severity: 'warning',
                message: 'Cache corruption detected',
                details: {
                  cacheName,
                  url: request.url,
                  reason: 'Entry exists but cannot be retrieved',
                },
                timestamp: Date.now(),
              });

              // Remove corrupted entry
              await cache.delete(request);
            }
          } catch (error) {
            // Error reading cache entry
            this.reportError({
              type: 'cache_corruption',
              severity: 'warning',
              message: 'Cache read error',
              details: {
                cacheName,
                url: request.url,
                error: (error as Error).message,
              },
              timestamp: Date.now(),
            });

            // Attempt to remove corrupted entry
            try {
              await cache.delete(request);
            } catch (deleteError) {
              console.error('Failed to delete corrupted cache entry:', deleteError);
            }
          }
        }
      }
    } catch (error) {
      this.reportError({
        type: 'cache_corruption',
        severity: 'error',
        message: 'Cache corruption detection failed',
        details: {
          error: (error as Error).message,
        },
        timestamp: Date.now(),
      });
    }

    // Re-check periodically (every 30 minutes)
    setTimeout(() => this.detectCacheCorruption(), 30 * 60 * 1000);
  }

  /**
   * Monitor cache quota and alert when approaching limits
   */
  private static async monitorCacheQuota() {
    if (!navigator.storage || !navigator.storage.estimate) return;

    const checkQuota = async () => {
      try {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate();
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;

        // Record in health history
        HealthReportGenerator.recordQuota({
          timestamp: Date.now(),
          percentage,
          usage,
          quota,
        });

        // Critical threshold exceeded
        if (percentage >= this.config.quotaCriticalThreshold) {
          this.reportError({
            type: 'quota_exhaustion',
            severity: 'critical',
            message: 'Cache quota critically low',
            details: {
              usage,
              quota,
              percentage: percentage.toFixed(1),
              usageMB: (usage / 1024 / 1024).toFixed(1),
              quotaMB: (quota / 1024 / 1024).toFixed(1),
            },
            timestamp: Date.now(),
          });

          // Attempt aggressive cleanup
          await this.emergencyCleanup();
        }
        // Warning threshold exceeded
        else if (percentage >= this.config.quotaWarningThreshold) {
          this.reportError({
            type: 'quota_exhaustion',
            severity: 'warning',
            message: 'Cache quota approaching limit',
            details: {
              usage,
              quota,
              percentage: percentage.toFixed(1),
              usageMB: (usage / 1024 / 1024).toFixed(1),
              quotaMB: (quota / 1024 / 1024).toFixed(1),
            },
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error('Quota monitoring error:', error);
      }
    };

    // Check quota every 5 minutes
    checkQuota();
    setInterval(checkQuota, 5 * 60 * 1000);
  }

  /**
   * Emergency cleanup when quota is critically low
   */
  private static async emergencyCleanup() {
    console.warn('🚨 Emergency cache cleanup initiated');

    try {
      const cacheNames = await caches.keys();
      
      // Delete oldest caches first (keep most recent)
      const sortedCaches = cacheNames.sort();
      const cachesToDelete = sortedCaches.slice(0, Math.ceil(sortedCaches.length / 2));

      for (const cacheName of cachesToDelete) {
        await caches.delete(cacheName);
        console.log(`Deleted cache: ${cacheName}`);
      }

      console.log('✅ Emergency cleanup complete');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Report error to monitoring services
   */
  private static async reportError(report: ErrorReport) {
    console.error(`[PWA Monitor] ${report.severity.toUpperCase()}: ${report.message}`, report.details);

    // Record in health history
    HealthReportGenerator.recordError({
      type: report.type,
      severity: report.severity,
      timestamp: report.timestamp,
      details: report.details,
    });

    // Send to Sentry
    if (this.config.sentryDSN && typeof (window as any).Sentry !== 'undefined') {
      (window as any).Sentry.captureException(new Error(report.message), {
        level: report.severity,
        tags: {
          component: 'pwa',
          type: report.type,
        },
        extra: report.details,
      });
    }

    // Send to admin dashboard
    if (this.config.adminDashboardEndpoint) {
      try {
        await fetch(this.config.adminDashboardEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
      } catch (error) {
        console.error('Failed to send error to admin dashboard:', error);
      }
    }

    // Send alerts (Slack/Email/Webhook)
    await sendAlert(report);

    // Track in analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'pwa_error', {
        event_category: 'PWA',
        event_label: report.type,
        severity: report.severity,
        message: report.message,
      });
    }
  }

  /**
   * Get monitoring status
   */
  static getStatus() {
    return {
      config: this.config,
      active: true,
    };
  }
}

export default PWAMonitoring;

// Auto-initialize with environment variables
if (typeof window !== 'undefined') {
  PWAMonitoring.init({
    sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    adminDashboardEndpoint: process.env.NEXT_PUBLIC_PWA_MONITORING_ENDPOINT,
  });
}
