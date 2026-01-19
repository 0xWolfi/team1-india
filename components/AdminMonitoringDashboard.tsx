'use client';
import { useEffect, useState } from 'react';

interface MonitoringAlert {
  id: string;
  type: 'sw_error' | 'cache_corruption' | 'quota_exhaustion';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  details?: any;
}

/**
 * Admin Monitoring Dashboard
 * Shows real-time PWA health alerts
 */
export function AdminMonitoringDashboard() {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [quotaStatus, setQuotaStatus] = useState<{ percentage: number; usage: number; quota: number } | null>(null);

  useEffect(() => {
    // Check cache quota
    const checkQuota = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate();
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        setQuotaStatus({ percentage, usage, quota });
      }
    };

    checkQuota();
    const quotaInterval = setInterval(checkQuota, 60000); // Every minute

    // Listen for PWA errors from monitoring
    const handleError = (event: any) => {
      const alert: MonitoringAlert = {
        id: Date.now().toString(),
        type: event.detail?.type || 'sw_error',
        severity: event.detail?.severity || 'error',
        message: event.detail?.message || 'Unknown error',
        timestamp: Date.now(),
        details: event.detail?.details,
      };

      setAlerts((prev) => [alert, ...prev].slice(0, 10)); // Keep last 10
    };

    window.addEventListener('pwa-monitoring-error', handleError);

    return () => {
      clearInterval(quotaInterval);
      window.removeEventListener('pwa-monitoring-error', handleError);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10 text-red-400';
      case 'error':
        return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      default:
        return 'border-zinc-500 bg-zinc-500/10 text-zinc-400';
    }
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-500';
    if (percentage >= 85) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">PWA Health Monitor</h2>

      {/* Quota Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Cache Storage</span>
          {quotaStatus && (
            <span className={`text-sm font-bold ${getQuotaColor(quotaStatus.percentage)}`}>
              {quotaStatus.percentage.toFixed(1)}%
            </span>
          )}
        </div>
        {quotaStatus && (
          <>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden mb-1">
              <div
                className={`h-full transition-all ${
                  quotaStatus.percentage >= 95
                    ? 'bg-red-500'
                    : quotaStatus.percentage >= 85
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(quotaStatus.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500">
              {(quotaStatus.usage / 1024 / 1024).toFixed(1)}MB / {(quotaStatus.quota / 1024 / 1024).toFixed(0)}MB
            </div>
          </>
        )}
      </div>

      {/* Alerts */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 mb-3">Recent Alerts</h3>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <div className="mb-2">✅</div>
            No alerts - all systems operational
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 text-sm ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-bold uppercase text-xs">{alert.severity}</span>
                  <span className="text-xs opacity-60">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-medium mb-1">{alert.message}</div>
                <div className="text-xs opacity-75 capitalize">{alert.type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={() => {
            if (confirm('Clear all alerts?')) {
              setAlerts([]);
            }
          }}
          className="text-xs text-zinc-500 hover:text-white transition"
        >
          Clear Alerts
        </button>
      </div>
    </div>
  );
}
