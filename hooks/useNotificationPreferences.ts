import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { notificationPreferences, NotificationPreferences } from '@/lib/notificationPreferences';

export function useNotificationPreferences() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationPreferences.getDefaults()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on load
  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences(session.user.id);
    }
  }, [session?.user?.id]);

  const loadPreferences = async (userId: string) => {
    try {
      setLoading(true);
      const data = await notificationPreferences.get(userId);
      setPreferences(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (category: keyof NotificationPreferences['categories'], enabled: boolean) => {
    if (!session?.user?.id) return;

    // Optimistic update
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }));

    try {
      await notificationPreferences.updateCategory(session.user.id, category, enabled);
    } catch (err) {
      // Revert on error
      console.error('Failed to update category:', err);
      loadPreferences(session.user.id);
    }
  };

  const toggleQuietHours = async (enabled: boolean) => {
    if (!session?.user?.id) return;

    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled
      }
    }));

    try {
      await notificationPreferences.updateQuietHours(session.user.id, { enabled });
    } catch (err) {
      loadPreferences(session.user.id);
    }
  };

  const updateQuietHoursTime = async (key: 'start' | 'end', value: string) => {
    if (!session?.user?.id) return;

    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));

    try {
      await notificationPreferences.updateQuietHours(session.user.id, { [key]: value });
    } catch (err) {
      loadPreferences(session.user.id);
    }
  };

  const setGlobalEnabled = async (enabled: boolean) => {
     if (!session?.user?.id) return;
     
     setPreferences(prev => ({ ...prev, enabled }));
     
     try {
       if (enabled) {
         await notificationPreferences.enable(session.user.id);
       } else {
         await notificationPreferences.disable(session.user.id);
       }
     } catch (err) {
       loadPreferences(session.user.id);
     }
  };

  return {
    preferences,
    loading,
    error,
    updateCategory,
    toggleQuietHours,
    updateQuietHoursTime,
    setGlobalEnabled
  };
}
