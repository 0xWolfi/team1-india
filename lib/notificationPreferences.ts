/**
 * Notification Preferences Manager
 * User preferences for push notifications
 */

export interface NotificationPreferences {
  enabled: boolean;
  categories: {
    applications: boolean;
    experiments: boolean;
    contributions: boolean;
    playbooks: boolean;
    announcements: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string; // IANA timezone or 'auto'
  };
  maxPerHour: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false, // Explicit opt-in required
  categories: {
    applications: true,
    experiments: true,
    contributions: true,
    playbooks: false,
    announcements: true,
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'auto',
  },
  maxPerHour: 3,
};

class NotificationPreferencesManager {
  private readonly STORAGE_KEY = 'notification-preferences';

  /**
   * Get user preferences
   */
  async get(userId: string): Promise<NotificationPreferences> {
    try {
      // Try to fetch from server first
      const response = await fetch(`/api/push/preferences/${userId}`);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch preferences from server, using local');
    }

    // Fallback to localStorage
    return this.getLocal(userId);
  }

  /**
   * Get local preferences
   */
  private getLocal(userId: string): NotificationPreferences {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}-${userId}`);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to parse preferences:', error);
    }

    return DEFAULT_PREFERENCES;
  }

  /**
   * Update preferences
   */
  async update(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const current = await this.get(userId);
    const updated = { ...current, ...preferences };

    // Save to localStorage
    localStorage.setItem(`${this.STORAGE_KEY}-${userId}`, JSON.stringify(updated));

    // Sync to server
    try {
      await fetch(`/api/push/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (error) {
      console.error('Failed to sync preferences to server:', error);
    }
  }

  /**
   * Reset to defaults
   */
  async reset(userId: string): Promise<void> {
    await this.update(userId, DEFAULT_PREFERENCES);
  }

  /**
   * Enable notifications
   */
  async enable(userId: string): Promise<void> {
    await this.update(userId, { enabled: true });
  }

  /**
   * Disable notifications
   */
  async disable(userId: string): Promise<void> {
    await this.update(userId, { enabled: false });
  }

  /**
   * Update category preference
   */
  async updateCategory(
    userId: string,
    category: keyof NotificationPreferences['categories'],
    enabled: boolean
  ): Promise<void> {
    const prefs = await this.get(userId);
    prefs.categories[category] = enabled;
    await this.update(userId, prefs);
  }

  /**
   * Update quiet hours
   */
  async updateQuietHours(
    userId: string,
    quietHours: Partial<NotificationPreferences['quietHours']>
  ): Promise<void> {
    const prefs = await this.get(userId);
    prefs.quietHours = { ...prefs.quietHours, ...quietHours };
    await this.update(userId, prefs);
  }

  /**
   * Get defaults
   */
  getDefaults(): NotificationPreferences {
    return { ...DEFAULT_PREFERENCES };
  }
}

// Export singleton
export const notificationPreferences = new NotificationPreferencesManager();
