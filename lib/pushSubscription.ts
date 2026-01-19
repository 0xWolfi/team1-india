/**
 * Push Subscription Manager
 * Manages Web Push subscriptions
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushSubscriptionManager {
  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    return await Notification.requestPermission();
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscriptionData | null> {
    try {
      // Check permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get public VAPID key from server
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey) as any,
      });

      // Convert to JSON
      const subscriptionJSON = subscription.toJSON();

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh,
          auth: subscriptionJSON.keys!.auth,
        },
      };

      // Save to server
      await this.saveToServer(userId, subscriptionData);

      console.log('✅ Push subscription created');

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch(`/api/push/subscribe/${userId}`, {
          method: 'DELETE',
        });

        console.log('✅ Push subscription removed');
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscriptionData | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) return null;

      const subscriptionJSON = subscription.toJSON();

      return {
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh,
          auth: subscriptionJSON.keys!.auth,
        },
      };
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Check if subscribed
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * Save subscription to server
   */
  private async saveToServer(userId: string, subscription: PushSubscriptionData) {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription,
      }),
    });
  }

  /**
   * Convert base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton
export const pushSubscription = new PushSubscriptionManager();

/**
 * React Hook for push subscription
 */
import { useState, useEffect } from 'react';

export function usePushSubscription(userId?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);

  useEffect(() => {
    // Check support
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
        setIsSupported(true);
        setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (userId) {
        checkSubscription();
    } else {
        setLoading(false);
    }
  }, [userId]);

  const checkSubscription = async () => {
    if (!userId) return;
    setLoading(true);
    const sub = await pushSubscription.getSubscription();
    setSubscription(sub);
    setIsSubscribed(!!sub);
    setLoading(false);
  };

  const subscribe = async () => {
    if (!userId) {
        console.error('UserId is required to subscribe');
        return false;
    }
    const result = await pushSubscription.subscribe(userId);
    if (result) {
      setIsSubscribed(true);
      setSubscription(result);
      setPermission('granted');
    }
    return result !== null;
  };

  const unsubscribe = async () => {
    if (!userId) return;
    await pushSubscription.unsubscribe(userId);
    setIsSubscribed(false);
    setSubscription(null);
  };

  return {
    isSubscribed,
    subscription,
    loading,
    isSupported,
    permission,
    subscribe,
    unsubscribe,
    refresh: checkSubscription,
  };
}
