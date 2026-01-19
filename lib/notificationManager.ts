/**
 * Notification Manager
 * Event-driven push notification delivery with throttling and quiet hours
 */

import { notificationPreferences, NotificationPreferences } from './notificationPreferences';

export type NotificationEvent = 
  | 'application_approved'
  | 'application_rejected'
  | 'experiment_comment'
  | 'contribution_milestone'
  | 'playbook_update'
  | 'admin_announcement'
  | 'application_submitted';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationPayload {
  userId: string;
  event: NotificationEvent;
  title: string;
  body: string;
  data?: {
    url?: string;
    id?: string;
    [key: string]: any;
  };
  icon?: string;
  badge?: string;
  priority?: NotificationPriority;
}

interface ThrottleRecord {
  timestamps: number[];
}

class NotificationManager {
  private throttle: Map<string, ThrottleRecord> = new Map();
  private readonly HOUR_MS = 3600000;

  /**
   * Send notification with throttling and quiet hours check
   */
  async send(payload: NotificationPayload): Promise<{
    success: boolean;
    throttled?: boolean;
    queued?: boolean;
    reason?: string;
  }> {
    try {
      // Get user preferences
      const prefs = await notificationPreferences.get(payload.userId);

      // Check if notifications enabled
      if (!prefs.enabled) {
        return { success: false, reason: 'notifications_disabled' };
      }

      // Check category permission
      const category = this.getCategory(payload.event);
      if (!prefs.categories[category]) {
        return { success: false, reason: 'category_disabled' };
      }

      // Check quiet hours
      if (this.isQuietHours(prefs)) {
        // Queue for later (8 AM next day)
        await this.queueForLater(payload);
        return { success: true, queued: true, reason: 'quiet_hours' };
      }

      // Check throttle
      if (!this.canSend(payload.userId, prefs.maxPerHour)) {
        return { success: false, throttled: true, reason: 'rate_limit' };
      }

      // Check for duplicates
      if (await this.isDuplicate(payload)) {
        return { success: false, reason: 'duplicate' };
      }

      // Send to push service
      await this.sendToPushService(payload);

      // Record send
      this.recordSend(payload.userId);

      console.log(`✅ Notification sent: ${payload.event} to ${payload.userId}`);

      return { success: true };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return { success: false, reason: 'error' };
    }
  }

  /**
   * Check if within quiet hours
   */
  private isQuietHours(prefs: any): boolean {
    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const timezone = prefs.quietHours.timezone === 'auto' 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : prefs.quietHours.timezone;

    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    const { start, end } = prefs.quietHours;

    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      // Crosses midnight
      return currentTime >= start || currentTime < end;
    }
  }

  /**
   * Check throttle limit
   */
  private canSend(userId: string, maxPerHour: number): boolean {
    const record = this.throttle.get(userId);
    if (!record) return true;

    const now = Date.now();
    const hourAgo = now - this.HOUR_MS;

    // Filter recent sends
    const recentSends = record.timestamps.filter(t => t > hourAgo);

    return recentSends.length < maxPerHour;
  }

  /**
   * Record send timestamp
   */
  private recordSend(userId: string) {
    const record = this.throttle.get(userId) || { timestamps: [] };
    const now = Date.now();

    // Add new timestamp
    record.timestamps.push(now);

    // Keep only last hour
    const hourAgo = now - this.HOUR_MS;
    record.timestamps = record.timestamps.filter(t => t > hourAgo);

    this.throttle.set(userId, record);
  }

  /**
   * Check for duplicate notifications
   */
  private async isDuplicate(payload: NotificationPayload): Promise<boolean> {
    // Check recent notifications in storage (client-side only logic if used in hook, but this is shared)
    // IMPORTANT: sessionStorage is NOT available in Server Context (API Routes).
    // This check should only run if we have access to storage or some backend cache.
    // For now, simple in-memory check or skip if server-side.
    if (typeof window === 'undefined') {
         return false; // Skip duplicate check on server for now
    }

    const key = `notification-${payload.userId}-${payload.event}-${payload.data?.id}`;
    const recent = sessionStorage.getItem(key);

    if (recent) {
      const timestamp = parseInt(recent);
      const fiveMinutesAgo = Date.now() - 300000;
      
      if (timestamp > fiveMinutesAgo) {
        return true; // Duplicate within 5 minutes
      }
    }

    // Store this notification
    sessionStorage.setItem(key, Date.now().toString());
    return false;
  }

  /**
   * Queue notification for later (after quiet hours)
   */
  private async queueForLater(payload: NotificationPayload) {
    // Similarly, localStorage is client-side.
    if (typeof window === 'undefined') return;

    const queue = JSON.parse(localStorage.getItem('notification-queue') || '[]');
    queue.push({
      ...payload,
      queuedAt: Date.now(),
    });
    localStorage.setItem('notification-queue', JSON.stringify(queue));
  }

  /**
   * Process queued notifications
   */
  async processQueue() {
    if (typeof window === 'undefined') return;

    const queue = JSON.parse(localStorage.getItem('notification-queue') || '[]');
    
    for (const payload of queue) {
      await this.send(payload);
    }

    localStorage.setItem('notification-queue', '[]');
  }

  /**
   * Send to push service
   */
  private async sendToPushService(payload: NotificationPayload) {
    // Call backend API to send push
    // Check if we are on client or server
    let baseUrl = '';
    if (typeof window !== 'undefined') {
        baseUrl = '';
    } else {
        // Server-side fetch needs full URL usually, but in Next.js internal calls can vary.
        // Best practice: Use process.env.NEXTAUTH_URL or similar if absolute needed.
        // defaulting to relative work often in Next 14+ specific contexts but safer with full.
        baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    }

    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payload.userId,
        notification: {
          title: payload.title.substring(0, 50), // Max 50 chars
          body: payload.body.substring(0, 150), // Max 150 chars
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/icon-badge.png',
          data: {
            url: payload.data?.url || '/',
            eventId: `${payload.event}-${Date.now()}`,
            timestamp: Date.now(),
            ...payload.data,
          },
          actions: this.getActions(payload.event),
        },
      }),
    });
  }

  /**
   * Get notification actions based on event type
   */
  private getActions(event: NotificationEvent): any[] {
    const actions: Record<NotificationEvent, any[]> = {
      application_approved: [
        { action: 'view', title: 'View Profile' },
      ],
      application_rejected: [
        { action: 'view', title: 'View Details' },
      ],
      experiment_comment: [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View' },
      ],
      contribution_milestone: [
        { action: 'view', title: 'View Progress' },
      ],
      playbook_update: [
        { action: 'view', title: 'View Playbook' },
      ],
      admin_announcement: [
        { action: 'view', title: 'View' },
      ],
      application_submitted: [
        { action: 'view', title: 'Review' },
      ]
    };

    return actions[event] || [];
  }

  /**
   * Get category from event
   */
  private getCategory(event: NotificationEvent): keyof NotificationPreferences['categories'] {
    if (event.startsWith('application')) return 'applications';
    if (event.startsWith('experiment')) return 'experiments';
    if (event.startsWith('contribution')) return 'contributions';
    if (event.startsWith('playbook')) return 'playbooks';
    if (event.startsWith('admin')) return 'announcements';
    return 'applications';
  }
}

// Export singleton
export const notificationManager = new NotificationManager();

/**
 * React Hook for sending notifications
 */
export function useNotifications() {
  return {
    send: (payload: NotificationPayload) => notificationManager.send(payload),
    processQueue: () => notificationManager.processQueue(),
  };
}
