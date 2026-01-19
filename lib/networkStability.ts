/**
 * Network Stability Monitor
 * Prevents premature sync during network flapping (rapid online/offline transitions)
 */

class NetworkStabilityMonitor {
  private stableOnline = false;
  private stableDelay = 5000; // 5 seconds
  private timer: NodeJS.Timeout | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initialize state
    this.stableOnline = navigator.onLine;
  }

  /**
   * Handle network coming online
   */
  private handleOnline() {
    console.log('🌐 Network detected, waiting for stability...');
    
    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      if (navigator.onLine) {
        this.stableOnline = true;
        console.log('✅ Network stable, triggering sync');
        this.notifyListeners();
      }
    }, this.stableDelay);
  }

  /**
   * Handle network going offline
   */
  private handleOffline() {
    console.log('📴 Network lost');
    
    if (this.timer) clearTimeout(this.timer);
    this.stableOnline = false;
  }

  /**
   * Check if network is stable
   */
  isStableOnline(): boolean {
    return this.stableOnline && navigator.onLine;
  }

  /**
   * Register callback for stable online event
   */
  onStableOnline(callback: () => void) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}

// Export singleton
export const networkMonitor = new NetworkStabilityMonitor();
