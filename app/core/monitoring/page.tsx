'use client';
import { AdminMonitoringDashboard } from '@/components/AdminMonitoringDashboard';
import { useWeeklyReport } from '@/lib/healthReports';

export default function MonitoringPage() {
  const { report, loading, refresh } = useWeeklyReport();

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">PWA Monitoring</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Real-time health and performance tracking</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-500">
              Auto-refresh: 30s
            </div>
          </div>
        </div>

        {/* Real-time Monitoring */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Real-Time Health</h2>
          <AdminMonitoringDashboard />
        </div>

        {/* Weekly Report */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Weekly Health Report</h2>
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded text-sm transition"
            >
              {loading ? 'Loading...' : 'Refresh Report'}
            </button>
          </div>

          {loading ? (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl p-8 text-center text-zinc-500">
              Loading report...
            </div>
          ) : report ? (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl p-6 space-y-6">
              {/* Health Score */}
              <div className="text-center pb-6 border-b border-black/10 dark:border-white/10">
                <div className={`text-6xl font-bold ${
                  report.score >= 90 ? 'text-green-500' :
                  report.score >= 70 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {report.score}/100
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 mt-2">Overall Health Score</div>
                <div className="text-xs text-zinc-600 mt-1">
                  {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 mb-2">Errors This Week</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">Critical</span>
                      <span className="font-mono">{report.metrics.errorCount.critical}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-400">Error</span>
                      <span className="font-mono">{report.metrics.errorCount.error}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-400">Warning</span>
                      <span className="font-mono">{report.metrics.errorCount.warning}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 mb-2">Cache Quota</div>
                  <div className="text-2xl font-bold">{report.metrics.cacheQuotaAvg.toFixed(1)}%</div>
                  <div className="text-xs text-zinc-600 mt-1">Average usage</div>
                </div>

                <div className="bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 mb-2">Cache Issues</div>
                  <div className="text-2xl font-bold">{report.metrics.corruptionIncidents}</div>
                  <div className="text-xs text-zinc-600 mt-1">Corruption incidents</div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="text-sm font-semibold mb-3">Recommendations</div>
                <div className="space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2 text-sm text-yellow-700 dark:text-yellow-200"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl p-8 text-center text-zinc-500">
              No report data available
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg p-4">
            <div className="text-xs text-zinc-500 mb-1">Service Worker</div>
            <div className="text-lg font-semibold text-green-500">Active</div>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg p-4">
            <div className="text-xs text-zinc-500 mb-1">Alert Channels</div>
            <div className="text-lg font-semibold">Email</div>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg p-4">
            <div className="text-xs text-zinc-500 mb-1">Recipients</div>
            <div className="text-lg font-semibold">3</div>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg p-4">
            <div className="text-xs text-zinc-500 mb-1">Monitoring</div>
            <div className="text-lg font-semibold text-green-500">Enabled</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-200">
          <div className="font-semibold mb-2">📊 Monitoring Active</div>
          <ul className="space-y-1 text-xs">
            <li>• Real-time cache quota monitoring (every 5 min)</li>
            <li>• Cache corruption detection (every 30 min)</li>
            <li>• Service worker error tracking</li>
            <li>• Email alerts for critical issues (3 recipients)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
