/**
 * Offline Storage Layer using IndexedDB
 * Stores pending actions and form drafts for offline-first functionality
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'team1-offline';
const DB_VERSION = 1;

export interface PendingAction {
  id: string;
  type: 'application' | 'vote' | 'comment' | 'contribution' | 'experiment';
  endpoint: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'success';
  idempotencyKey?: string; // Prevent duplicates
}

export interface DraftForm {
  id: string;
  formType: string;
  data: any;
  lastSaved: number;
  expiresAt: number;
}

class OfflineStorage {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Pending actions store
          if (!db.objectStoreNames.contains('pendingActions')) {
            const actionStore = db.createObjectStore('pendingActions', { 
              keyPath: 'id' 
            });
            actionStore.createIndex('status', 'status');
            actionStore.createIndex('timestamp', 'timestamp');
            actionStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: false });
          }

          // Drafts store
          if (!db.objectStoreNames.contains('drafts')) {
            const draftStore = db.createObjectStore('drafts', { 
              keyPath: 'id' 
            });
            draftStore.createIndex('formType', 'formType');
            draftStore.createIndex('expiresAt', 'expiresAt');
          }
        },
      });

      console.log('✅ OfflineStorage initialized');
    })();

    return this.initPromise;
  }

  /**
   * Queue pending action with idempotency check
   */
  async queueAction(
    action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount' | 'status'>
  ): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    // Generate idempotency key if not provided
    const idempotencyKey = action.idempotencyKey || 
      this.generateIdempotencyKey(action.type, action.body);

    // Check for duplicate
    const existing = await this.db.getFromIndex(
      'pendingActions',
      'idempotencyKey',
      idempotencyKey
    );

    if (existing && existing.status !== 'failed') {
      console.log('⚠️ Duplicate action detected, skipping', idempotencyKey);
      return existing.id;
    }

    const pendingAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      idempotencyKey,
    };

    await this.db.add('pendingActions', pendingAction);
    console.log('📤 Action queued:', pendingAction.type, pendingAction.id);

    return pendingAction.id;
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    await this.init();
    if (!this.db) return [];

    const actions = await this.db.getAll('pendingActions');
    return actions.filter(a => a.status === 'pending');
  }

  /**
   * Update action status
   */
  async updateActionStatus(
    id: string,
    status: PendingAction['status'],
    incrementRetry = false
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    const action = await this.db.get('pendingActions', id);
    if (!action) return;

    action.status = status;
    if (incrementRetry) {
      action.retryCount++;
    }

    await this.db.put('pendingActions', action);
  }

  /**
   * Delete action
   */
  async deleteAction(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete('pendingActions', id);
  }

  /**
   * Save form draft
   */
  async saveDraft(formType: string, data: any): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('DB not initialized');

    const draft: DraftForm = {
      id: `${formType}-${Date.now()}`,
      formType,
      data,
      lastSaved: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await this.db.put('drafts', draft);
    console.log('💾 Draft saved:', formType);

    return draft.id;
  }

  /**
   * Get most recent draft for form type
   */
  async getDraft(formType: string): Promise<DraftForm | null> {
    await this.init();
    if (!this.db) return null;

    const drafts = await this.db.getAllFromIndex('drafts', 'formType', formType);

    // Filter expired drafts
    const validDrafts = drafts.filter(d => d.expiresAt > Date.now());

    if (validDrafts.length === 0) return null;

    // Return most recent
    return validDrafts.sort((a, b) => b.lastSaved - a.lastSaved)[0];
  }

  /**
   * Delete draft
   */
  async deleteDraft(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.delete('drafts', id);
  }

  /**
   * Clean up expired drafts
   */
  async cleanupExpiredDrafts(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const drafts = await this.db.getAll('drafts');
    const now = Date.now();
    let cleaned = 0;

    for (const draft of drafts) {
      if (draft.expiresAt < now) {
        await this.db.delete('drafts', draft.id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🗑️ Cleaned ${cleaned} expired drafts`);
    }

    return cleaned;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
  }> {
    await this.init();
    if (!this.db) return { pending: 0, syncing: 0, failed: 0 };

    const actions = await this.db.getAll('pendingActions');

    return {
      pending: actions.filter(a => a.status === 'pending').length,
      syncing: actions.filter(a => a.status === 'syncing').length,
      failed: actions.filter(a => a.status === 'failed').length,
    };
  }

  /**
   * Clear all data (for logout)
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.clear('pendingActions');
    await this.db.clear('drafts');

    console.log('🗑️ Offline storage cleared');
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(type: string, body: any): string {
    const str = JSON.stringify(body);
    const hash = this.simpleHash(str);
    return `${type}-${hash}`;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
const offlineStorage = new OfflineStorage();

// Auto-initialize
if (typeof window !== 'undefined') {
  offlineStorage.init();
  
  // Auto-cleanup expired drafts on load
  offlineStorage.cleanupExpiredDrafts();
}

export default offlineStorage;
