/**
 * Alert Notification System
 * Sends alerts to Slack/Email/Webhooks for critical PWA issues
 */

interface ErrorReport {
  type: 'sw_error' | 'cache_corruption' | 'quota_exhaustion';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  details: any;
  timestamp: number;
}

interface AlertChannel {
  type: 'slack' | 'email' | 'webhook';
  endpoint: string;
  minSeverity: 'warning' | 'error' | 'critical';
}

class AlertNotifier {
  private channels: AlertChannel[] = [];

  constructor() {
    this.initializeChannels();
  }

  /**
   * Initialize alert channels from environment variables
   */
  private initializeChannels() {
    // Slack webhook
    if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL) {
      this.channels.push({
        type: 'slack',
        endpoint: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
        minSeverity: 'error', // Only errors and critical
      });
    }

    // Email endpoint
    if (process.env.NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT) {
      this.channels.push({
        type: 'email',
        endpoint: process.env.NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT,
        minSeverity: 'critical', // Only critical
      });
    }

    // Custom webhook
    if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL) {
      this.channels.push({
        type: 'webhook',
        endpoint: process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL,
        minSeverity: 'warning', // All alerts
      });
    }
  }

  /**
   * Notify all configured channels
   */
  async notify(alert: ErrorReport): Promise<void> {
    for (const channel of this.channels) {
      if (this.shouldNotify(alert.severity, channel.minSeverity)) {
        try {
          await this.send(channel, alert);
        } catch (error) {
          console.error(`Failed to send alert to ${channel.type}:`, error);
        }
      }
    }
  }

  /**
   * Check if alert meets severity threshold
   */
  private shouldNotify(alertSeverity: string, minSeverity: string): boolean {
    const levels = ['warning', 'error', 'critical'];
    return levels.indexOf(alertSeverity) >= levels.indexOf(minSeverity);
  }

  /**
   * Send alert to specific channel
   */
  private async send(channel: AlertChannel, alert: ErrorReport): Promise<void> {
    switch (channel.type) {
      case 'slack':
        await this.sendSlack(channel.endpoint, alert);
        break;
      case 'email':
        await this.sendEmail(channel.endpoint, alert);
        break;
      case 'webhook':
        await this.sendWebhook(channel.endpoint, alert);
        break;
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(webhook: string, alert: ErrorReport): Promise<void> {
    const color = alert.severity === 'critical' ? 'danger' : 
                  alert.severity === 'error' ? 'warning' : '#ff9800';

    const emoji = alert.severity === 'critical' ? '🚨' :
                  alert.severity === 'error' ? '⚠️' : '📊';

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `${emoji} PWA Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
          text: alert.message,
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Type', value: alert.type, short: true },
            { title: 'Timestamp', value: new Date(alert.timestamp).toISOString(), short: true },
            { title: 'Details', value: JSON.stringify(alert.details, null, 2), short: false },
          ],
          footer: 'Team1 PWA Monitor',
          ts: Math.floor(alert.timestamp / 1000),
        }],
      }),
    });

    console.log(`📤 Alert sent to Slack: ${alert.type}`);
  }

  /**
   * Send email notification
   */
  private async sendEmail(endpoint: string, alert: ErrorReport): Promise<void> {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@team1india.com',
        subject: `🚨 Critical PWA Alert: ${alert.type}`,
        body: `
          <h2>PWA Critical Alert</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
          <h3>Details:</h3>
          <pre>${JSON.stringify(alert.details, null, 2)}</pre>
        `,
      }),
    });

    console.log(`📧 Alert sent to email: ${alert.type}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(url: string, alert: ErrorReport): Promise<void> {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    console.log(`🔗 Alert sent to webhook: ${alert.type}`);
  }

  /**
   * Get configured channels count
   */
  getChannelCount(): number {
    return this.channels.length;
  }
}

// Export singleton
export const alertNotifier = new AlertNotifier();

/**
 * Send alert (wrapper function)
 */
export async function sendAlert(alert: ErrorReport): Promise<void> {
  await alertNotifier.notify(alert);
}
