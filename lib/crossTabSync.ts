/**
 * Cross-Tab Sync Coordination
 * Coordinates background sync across multiple browser tabs
 */

import { BackgroundSyncManager } from './backgroundSync';

const SYNC_LOCK_KEY = 'pwa-sync-lock';
const SYNC_STATUS_KEY = 'pwa-sync-status';
const LOCK_TIMEOUT = 30000; // 30 seconds

interface SyncLock {
  tabId: string;
  timestamp: number;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSync: number;
  syncingTabId: string | null;
}

class CrossTabSync {
  private tabId: string;
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (typeof window === 'undefined') return;

    // Create broadcast channel for cross-tab communication
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('pwa-sync');
      this.setupChannelListeners();
    }

    // Listen for storage events (fallback for older browsers)
    window.addEventListener('storage', (e) => {
      if (e.key === SYNC_STATUS_KEY) {
        this.handleSyncStatusChange();
      }
    });

    // Release lock on tab close
    window.addEventListener('beforeunload', () => {
      this.releaseLock();
    });

    console.log(`🔄 Cross-tab sync initialized (${this.tabId})`);
  }

  /**
   * Acquire sync lock (only one tab can sync at a time)
   */
  async acquireLock(): Promise<boolean> {
    const existingLock = this.getLock();

    // Check if lock is stale
    if (existingLock && Date.now() - existingLock.timestamp < LOCK_TIMEOUT) {
      if (existingLock.tabId !== this.tabId) {
        console.log(`🔒 Sync locked by another tab (${existingLock.tabId})`);
        return false;
      }
    }

    // Acquire lock
    const lock: SyncLock = {
      tabId: this.tabId,
      timestamp: Date.now(),
    };

    localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify(lock));
    console.log(`🔓 Sync lock acquired (${this.tabId})`);

    return true;
  }

  /**
   * Release sync lock
   */
  releaseLock() {
    const lock = this.getLock();
    if (lock && lock.tabId === this.tabId) {
      localStorage.removeItem(SYNC_LOCK_KEY);
      console.log(`🔓 Sync lock released (${this.tabId})`);
    }
  }

  /**
   * Get current lock
   */
  private getLock(): SyncLock | null {
    try {
      const lockData = localStorage.getItem(SYNC_LOCK_KEY);
      return lockData ? JSON.parse(lockData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Coordinate sync across tabs
   */
  async coordinateSync(): Promise<boolean> {
    const hasLock = await this.acquireLock();
    
    if (!hasLock) {
      // Another tab is syncing
      return false;
    }

    try {
      // Update sync status
      this.updateSyncStatus(true);

      // Broadcast to other tabs
      this.broadcast({ type: 'sync-start', tabId: this.tabId });

      // Perform sync
      await BackgroundSyncManager.processQueue();

      // Broadcast completion
      this.broadcast({ type: 'sync-complete', tabId: this.tabId });

      return true;
    } finally {
      this.updateSyncStatus(false);
      this.releaseLock();
    }
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(isSyncing: boolean) {
    const status: SyncStatus = {
      isSyncing,
      lastSync: Date.now(),
      syncingTabId: isSyncing ? this.tabId : null,
    };

    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus | null {
    try {
      const statusData = localStorage.getItem(SYNC_STATUS_KEY);
      return statusData ? JSON.parse(statusData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Setup broadcast channel listeners
   */
  private setupChannelListeners() {
    if (!this.channel) return;

    this.channel.addEventListener('message', (event) => {
      const { type, tabId } = event.data;

      if (tabId === this.tabId) return; // Ignore own messages

      switch (type) {
        case 'sync-start':
          console.log(`📡 Another tab started syncing (${tabId})`);
          break;
        case 'sync-complete':
          console.log(`📡 Another tab completed syncing (${tabId})`);
          // Reload queue status if needed
          break;
        case 'queue-updated':
          console.log(`📡 Queue updated in another tab (${tabId})`);
          break;
      }
    });
  }

  /**
   * Broadcast message to other tabs
   */
  private broadcast(message: any) {
    if (this.channel) {
      this.channel.postMessage({ ...message, tabId: this.tabId });
    }
  }

  /**
   * Handle sync status change
   */
  private handleSyncStatusChange() {
    const status = this.getSyncStatus();
    
    if (status && !status.isSyncing && status.syncingTabId !== this.tabId) {
      // Another tab finished syncing, might want to refresh UI
      window.dispatchEvent(new CustomEvent('cross-tab-sync-complete'));
    }
  }

  /**
   * Notify other tabs of queue update
   */
  notifyQueueUpdate() {
    this.broadcast({ type: 'queue-updated' });
  }
}

// Export singleton
export const crossTabSync = new CrossTabSync();

/**
 * Enhanced sync that coordinates across tabs
 */
export async function coordinatedSync(): Promise<boolean> {
  return await crossTabSync.coordinateSync();
}
