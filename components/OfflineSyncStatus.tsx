'use client';
import { useState, useEffect } from 'react';
import offlineStorage from '@/lib/offlineStorage';
import { BackgroundSyncManager } from '@/lib/backgroundSync';

/**
 * Offline Sync Status Component
 * Shows sync queue status and manual retry option
 */
export function OfflineSyncStatus() {
  const [status, setStatus] = useState({ pending: 0, syncing: 0, failed: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update online status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update queue status
    const updateStatus = async () => {
      const queueStatus = await offlineStorage.getQueueStatus();
      setStatus(queueStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Every 5 seconds

    // Listen for sync events
    const handleSyncEvent = (event: any) => {
      if (event.detail.event === 'sync_success') {
        updateStatus();
      }
    };

    window.addEventListener('offline-sync', handleSyncEvent);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('offline-sync', handleSyncEvent);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await BackgroundSyncManager.processQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show if no pending actions
  if (status.pending === 0 && status.failed === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 text-sm max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="font-medium text-white">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {status.failed > 0 && (
          <span className="text-xs text-red-400 font-medium">
            {status.failed} failed
          </span>
        )}
      </div>

      {status.pending > 0 && (
        <div className="text-zinc-400 text-xs mb-2">
          {status.pending} action{status.pending > 1 ? 's' : ''} queued for sync
        </div>
      )}

      {status.failed > 0 && isOnline && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-xs py-2 rounded transition"
        >
          {isSyncing ? 'Syncing...' : 'Retry Now'}
        </button>
      )}
    </div>
  );
}
