/**
 * Weekly Health Reports Generator
 * Generates comprehensive PWA health reports with recommendations
 */

interface WeeklyReport {
  period: { start: Date; end: Date };
  metrics: {
    errorCount: { warning: number; error: number; critical: number };
    cacheQuotaAvg: number;
    corruptionIncidents: number;
    swUpdateSuccess: number;
    swUpdateFailures: number;
  };
  recommendations: string[];
  score: number; // 0-100
}

interface ErrorRecord {
  type: string;
  severity: string;
  timestamp: number;
  details: any;
}

interface QuotaRecord {
  timestamp: number;
  percentage: number;
  usage: number;
  quota: number;
}

class HealthReportGenerator {
  private readonly STORAGE_KEY = 'pwa-health-history';

  /**
   * Generate weekly health report
   */
  async generateWeeklyReport(): Promise<WeeklyReport> {
    const errors = await this.getErrorsLastWeek();
    const quotaData = await this.getQuotaDataLastWeek();

    const metrics = {
      errorCount: this.categorizeErrors(errors),
      cacheQuotaAvg: this.calculateAvgQuota(quotaData),
      corruptionIncidents: errors.filter(e => e.type === 'cache_corruption').length,
      swUpdateSuccess: 0, // Could track from analytics
      swUpdateFailures: errors.filter(e => e.type === 'sw_error').length,
    };

    const recommendations = this.generateRecommendations(errors, quotaData);
    const score = this.calculateHealthScore(metrics, errors, quotaData);

    return {
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      metrics,
      recommendations,
      score,
    };
  }

  /**
   * Get errors from last week
   */
  private async getErrorsLastWeek(): Promise<ErrorRecord[]> {
    try {
      const history = localStorage.getItem('pwa-error-history');
      if (!history) return [];

      const errors = JSON.parse(history) as ErrorRecord[];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return errors.filter(e => e.timestamp >= weekAgo);
    } catch {
      return [];
    }
  }

  /**
   * Get quota data from last week
   */
  private async getQuotaDataLastWeek(): Promise<QuotaRecord[]> {
    try {
      const history = localStorage.getItem('pwa-quota-history');
      if (!history) return [];

      const data = JSON.parse(history) as QuotaRecord[];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return data.filter(d => d.timestamp >= weekAgo);
    } catch {
      return [];
    }
  }

  /**
   * Categorize errors by severity
   */
  private categorizeErrors(errors: ErrorRecord[]): { warning: number; error: number; critical: number } {
    return {
      warning: errors.filter(e => e.severity === 'warning').length,
      error: errors.filter(e => e.severity === 'error').length,
      critical: errors.filter(e => e.severity === 'critical').length,
    };
  }

  /**
   * Calculate average quota usage
   */
  private calculateAvgQuota(quotaData: QuotaRecord[]): number {
    if (quotaData.length === 0) return 0;

    const sum = quotaData.reduce((acc, d) => acc + d.percentage, 0);
    return sum / quotaData.length;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(errors: ErrorRecord[], quotaData: QuotaRecord[]): string[] {
    const recommendations: string[] = [];

    // High error rate
    if (errors.length > 50) {
      recommendations.push('⚠️ High error rate detected (>50/week). Review error patterns in monitoring dashboard.');
    }

    // Critical errors
    const criticalCount = errors.filter(e => e.severity === 'critical').length;
    if (criticalCount > 5) {
      recommendations.push('🚨 Multiple critical errors. Immediate investigation required.');
    }

    // High quota usage
    const avgQuota = this.calculateAvgQuota(quotaData);
    if (avgQuota > 80) {
      recommendations.push('💾 Cache quota consistently >80%. Consider lowering maxEntries in caching config.');
    }

    // Frequent corruption
    const corruptionCount = errors.filter(e => e.type === 'cache_corruption').length;
    if (corruptionCount > 10) {
      recommendations.push('🔧 Frequent cache corruption detected. Investigate cache invalidation strategy.');
    }

    // Service worker errors
    const swErrors = errors.filter(e => e.type === 'sw_error').length;
    if (swErrors > 5) {
      recommendations.push('⚙️ Multiple service worker errors. Review SW registration and update flow.');
    }

    // Good health
    if (recommendations.length === 0) {
      recommendations.push('✅ Excellent PWA health. No issues detected.');
    }

    return recommendations;
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(
    metrics: WeeklyReport['metrics'],
    errors: ErrorRecord[],
    quotaData: QuotaRecord[]
  ): number {
    let score = 100;

    // Deduct points for errors
    score -= metrics.errorCount.warning * 0.5;
    score -= metrics.errorCount.error * 2;
    score -= metrics.errorCount.critical * 5;

    // Deduct for high quota
    if (metrics.cacheQuotaAvg > 90) {
      score -= 10;
    } else if (metrics.cacheQuotaAvg > 80) {
      score -= 5;
    }

    // Deduct for corruption
    score -= metrics.corruptionIncidents * 1;

    // Deduct for SW failures
    score -= metrics.swUpdateFailures * 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Record error for history
   */
  static recordError(error: ErrorRecord): void {
    try {
      const history = localStorage.getItem('pwa-error-history');
      const errors = history ? JSON.parse(history) : [];

      errors.push(error);

      // Keep last 500 errors
      const trimmed = errors.slice(-500);

      localStorage.setItem('pwa-error-history', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to record error:', e);
    }
  }

  /**
   * Record quota data for history
   */
  static recordQuota(quota: QuotaRecord): void {
    try {
      const history = localStorage.getItem('pwa-quota-history');
      const data = history ? JSON.parse(history) : [];

      data.push(quota);

      // Keep last 500 records
      const trimmed = data.slice(-500);

      localStorage.setItem('pwa-quota-history', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to record quota:', e);
    }
  }

  /**
   * Generate HTML email report
   */
  generateReportHTML(report: WeeklyReport): string {
    const scoreColor = report.score >= 90 ? '#10b981' :
                       report.score >= 70 ? '#f59e0b' : '#ef4444';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .score { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
          .metric { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .metric-label { color: #6b7280; font-size: 14px; }
          .metric-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          .recommendation { background: #fef3c7; padding: 12px; margin: 8px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PWA Weekly Health Report</h1>
          <p>${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div class="score">${report.score}/100</div>
          <p>Overall Health Score</p>
        </div>

        <h2>Metrics</h2>
        <div class="metric">
          <div class="metric-label">Errors This Week</div>
          <div class="metric-value">
            ${report.metrics.errorCount.critical} Critical, 
            ${report.metrics.errorCount.error} Errors, 
            ${report.metrics.errorCount.warning} Warnings
          </div>
        </div>

        <div class="metric">
          <div class="metric-label">Average Cache Quota</div>
          <div class="metric-value">${report.metrics.cacheQuotaAvg.toFixed(1)}%</div>
        </div>

        <div class="metric">
          <div class="metric-label">Cache Corruption Incidents</div>
          <div class="metric-value">${report.metrics.corruptionIncidents}</div>
        </div>

        <h2>Recommendations</h2>
        ${report.recommendations.map(r => `<div class="recommendation">${r}</div>`).join('')}
      </body>
      </html>
    `;
  }
}

// Export class for static methods
export { HealthReportGenerator };

// Export singleton
export const healthReportGenerator = new HealthReportGenerator();

/**
 * React Hook for weekly reports
 */
import { useState, useEffect } from 'react';

export function useWeeklyReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const newReport = await healthReportGenerator.generateWeeklyReport();
    setReport(newReport);
    setLoading(false);
  };

  useEffect(() => {
    generateReport();
  }, []);

  return {
    report,
    loading,
    refresh: generateReport,
  };
}
