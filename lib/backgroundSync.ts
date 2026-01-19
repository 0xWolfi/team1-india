/**
 * Background Sync Utility for Offline Form Submissions
 * Integrated with IndexedDB for persistent queue
 */

import offlineStorage, { PendingAction } from './offlineStorage';
import { networkMonitor } from './networkStability';

export class BackgroundSyncManager {
  private static isSyncing = false;

  /**
   * Queue a request for background sync
   */
  static async queueRequest(url: string, options: RequestInit): Promise<string> {
    try {
      const actionId = await offlineStorage.queueAction({
        type: this.inferType(url),
        endpoint: url,
        method: options.method || 'POST',
        body: options.body ? JSON.parse(options.body as string) : null,
        headers: options.headers as Record<string, string>,
      });

      console.log(`📤 Queued request for sync: ${url}`);

      // Try to sync immediately if online and stable
      if (networkMonitor.isStableOnline()) {
        setTimeout(() => this.processQueue(), 1000);
      }

      return actionId;
    } catch (error) {
      console.error('Failed to queue request:', error);
      throw error;
    }
  }

  /**
   * Process all queued requests with exponential backoff
   */
  static async processQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log('📬 Sync already in progress, skipping');
      return;
    }

    if (!networkMonitor.isStableOnline()) {
      console.log('🚫 Network unstable, postponing sync');
      return;
    }

    this.isSyncing = true;

    try {
      const actions = await offlineStorage.getPendingActions();

      if (actions.length === 0) {
        console.log('📭 No queued requests to process');
        return;
      }

      console.log(`📬 Processing ${actions.length} queued requests`);

      for (const action of actions) {
        await this.processAction(action);
      }

      console.log('✅ Queue processing complete');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process single action with retry logic
   */
  private static async processAction(action: PendingAction): Promise<void> {
    const maxRetries = 3;
    
    if (action.retryCount >= maxRetries) {
      console.warn(`⚠️ Max retries exceeded: ${action.endpoint}`);
      await offlineStorage.updateActionStatus(action.id, 'failed');
      this.notifyUser('sync_failed', action);
      return;
    }

    try {
      // Mark as syncing
      await offlineStorage.updateActionStatus(action.id, 'syncing');

      // Calculate backoff delay
      const backoffDelay = Math.pow(2, action.retryCount) * 1000; // 1s, 2s, 4s
      if (action.retryCount > 0) {
        await this.sleep(backoffDelay);
      }

      // Execute request
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: action.headers,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (response.ok) {
        console.log(`✅ Synced: ${action.endpoint}`);
        await offlineStorage.deleteAction(action.id);
        this.notifyUser('sync_success', action);
      } else if (response.status === 409) {
        // Conflict - likely duplicate
        console.warn(`⚠️ Conflict (409): ${action.endpoint}`);
        await offlineStorage.deleteAction(action.id);
      } else {
        // Retry on failure
        console.warn(`⚠️ Sync failed (${response.status}): ${action.endpoint}`);
        await offlineStorage.updateActionStatus(action.id, 'pending', true);
      }
    } catch (error) {
      console.error(`❌ Sync error: ${action.endpoint}`, error);
      
      if (action.retryCount + 1 < maxRetries) {
        // Will retry
        await offlineStorage.updateActionStatus(action.id, 'pending', true);
      } else {
        // Max retries exceeded
        await offlineStorage.updateActionStatus(action.id, 'failed');
        this.notifyUser('sync_failed', action);
      }
    }
  }

  /**
   * Clear the entire queue
   */
  static async clearQueue(): Promise<void> {
    const actions = await offlineStorage.getPendingActions();
    for (const action of actions) {
      await offlineStorage.deleteAction(action.id);
    }
    console.log('🗑️ Sync queue cleared');
  }

  /**
   * Get queue status
   */
  static async getQueueStatus() {
    return await offlineStorage.getQueueStatus();
  }

  /**
   * Notify user of sync events
   */
  private static notifyUser(event: 'sync_success' | 'sync_failed', action: PendingAction) {
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline-sync', {
        detail: { event, action },
      }));
    }

    // Track analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: 'Offline',
        action_type: action.type,
        endpoint: action.endpoint,
      });
    }
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Infer action type from URL
   */
  private static inferType(url: string): PendingAction['type'] {
    if (url.includes('/applications')) return 'application';
    if (url.includes('/vote')) return 'vote';
    if (url.includes('/comment')) return 'comment';
    if (url.includes('/experiments')) return 'experiment';
    return 'contribution';
  }
}

/**
 * React Hook for Background Sync
 */
export function useBackgroundSync() {
  const queueRequest = async (url: string, options: RequestInit) => {
    return BackgroundSyncManager.queueRequest(url, options);
  };

  const processQueue = async () => {
    return BackgroundSyncManager.processQueue();
  };

  return {
    queueRequest,
    processQueue,
    getStatus: BackgroundSyncManager.getQueueStatus,
    clearQueue: BackgroundSyncManager.clearQueue,
  };
}

// Auto-process queue when network becomes stable
if (typeof window !== 'undefined') {
  networkMonitor.onStableOnline(() => {
    console.log('🌐 Network stable, processing sync queue...');
    BackgroundSyncManager.processQueue();
  });
}

