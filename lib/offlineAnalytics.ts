/**
 * Offline Analytics Buffer
 * Queues analytics events when offline and sends when connection restored
 */

interface AnalyticsEvent {
  id: string;
  name: string;
  params: Record<string, any>;
  timestamp: number;
}

const BUFFER_KEY = 'offline-analytics-buffer';
const MAX_BUFFER_SIZE = 100;

class OfflineAnalyticsBuffer {
  private buffer: AnalyticsEvent[] = [];

  constructor() {
    if (typeof window === 'undefined') return;

    // Load buffer from storage
    this.loadBuffer();

    // Flush on network restore
    window.addEventListener('online', () => {
      this.flushBuffer();
    });

    // Periodic flush (every 5 minutes if online)
    setInterval(() => {
      if (navigator.onLine) {
        this.flushBuffer();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Track event (buffers if offline)
   */
  track(eventName: string, params: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      params: {
        ...params,
        queued_at: Date.now(),
        was_offline: !navigator.onLine,
      },
      timestamp: Date.now(),
    };

    if (navigator.onLine) {
      // Online: Send immediately
      this.sendEvent(event);
    } else {
      // Offline: Add to buffer
      this.addToBuffer(event);
      console.log(`📊 Analytics buffered: ${eventName}`);
    }
  }

  /**
   * Add event to buffer
   */
  private addToBuffer(event: AnalyticsEvent) {
    this.buffer.push(event);

    // Limit buffer size
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer = this.buffer.slice(-MAX_BUFFER_SIZE);
    }

    this.saveBuffer();
  }

  /**
   * Flush buffer to analytics service
   */
  private async flushBuffer() {
    if (this.buffer.length === 0) return;

    console.log(`📊 Flushing ${this.buffer.length} analytics events...`);

    const events = [...this.buffer];
    this.buffer = [];
    this.saveBuffer();

    for (const event of events) {
      await this.sendEvent(event);
    }

    console.log(`✅ Analytics buffer flushed`);
  }

  /**
   * Send event to analytics service
   */
  private async sendEvent(event: AnalyticsEvent) {
    try {
      // Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', event.name, event.params);
      }

      // Custom analytics endpoint (optional)
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
      // Re-add to buffer if failed
      this.addToBuffer(event);
    }
  }

  /**
   * Load buffer from localStorage
   */
  private loadBuffer() {
    try {
      const saved = localStorage.getItem(BUFFER_KEY);
      if (saved) {
        this.buffer = JSON.parse(saved);
        console.log(`📊 Loaded ${this.buffer.length} buffered analytics events`);
      }
    } catch (error) {
      console.error('Failed to load analytics buffer:', error);
    }
  }

  /**
   * Save buffer to localStorage
   */
  private saveBuffer() {
    try {
      localStorage.setItem(BUFFER_KEY, JSON.stringify(this.buffer));
    } catch (error) {
      console.error('Failed to save analytics buffer:', error);
    }
  }

  /**
   * Get buffer status
   */
  getStatus() {
    return {
      count: this.buffer.length,
      oldestTimestamp: this.buffer.length > 0 ? this.buffer[0].timestamp : null,
    };
  }

  /**
   * Clear buffer
   */
  clear() {
    this.buffer = [];
    this.saveBuffer();
  }
}

// Export singleton
export const analyticsBuffer = new OfflineAnalyticsBuffer();

/**
 * Enhanced analytics tracking with offline support
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  analyticsBuffer.track(eventName, params);
}

/**
 * React Hook for analytics
 */
export function useAnalytics() {
  return {
    track: trackEvent,
    getStatus: () => analyticsBuffer.getStatus(),
    flush: () => analyticsBuffer['flushBuffer'](),
  };
}
