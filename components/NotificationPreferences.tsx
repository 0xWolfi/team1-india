"use client";

import React from 'react';
import { usePushSubscription } from '@/lib/pushSubscription';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { motion } from 'framer-motion';

export const NotificationPreferences = () => {
  const { 
    isSupported, 
    permission, 
    subscription, 
    subscribe, 
    unsubscribe, 
    loading: subLoading 
  } = usePushSubscription();

  const { 
    preferences, 
    loading: prefLoading, 
    setGlobalEnabled,
    updateCategory,
    toggleQuietHours,
    updateQuietHoursTime
  } = useNotificationPreferences();

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
        Push notifications are not supported directly in this browser environment. Try installing the app as a PWA.
      </div>
    );
  }

  const handleToggleMaster = async () => {
    if (preferences.enabled) {
      // Disable everything
      await setGlobalEnabled(false);
      await unsubscribe();
    } else {
      // Enable
      await subscribe(); // This requests permission if needed
      await setGlobalEnabled(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
        <div>
          <h3 className="text-lg font-medium text-white">Push Notifications</h3>
          <div className="text-sm text-white/60">
            {permission === 'denied' 
              ? 'Notifications are blocked in browser settings.' 
              : 'Receive updates about your applications and activities.'}
          </div>
        </div>
        <button
          onClick={handleToggleMaster}
          disabled={subLoading || permission === 'denied'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black ${
            preferences.enabled && permission === 'granted' ? 'bg-primary' : 'bg-white/20'
          }`}
        >
          <span
            className={`${
              preferences.enabled && permission === 'granted' ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>

      {preferences.enabled && permission === 'granted' && (
        <motion.div
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           className="space-y-6"
        >
          {/* Categories */}
          <div className="space-y-3">
             <h4 className="text-sm font-medium text-white/80 uppercase tracking-wider">Notification Types</h4>
             <div className="grid gap-2">
                {[
                  { key: 'applications', label: 'Applications', desc: 'Updates on your application status' },
                  { key: 'experiments', label: 'Experiments', desc: 'New experiments and feedback' },
                  { key: 'contributions', label: 'Contributions', desc: 'Status of your content contributions' },
                  { key: 'playbooks', label: 'Playbooks', desc: 'New operational playbooks' },
                  { key: 'announcements', label: 'Announcements', desc: 'Important community updates' },
                ].map((cat) => (
                  <div key={cat.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-white">{cat.label}</div>
                      <div className="text-xs text-white/50">{cat.desc}</div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={preferences.categories[cat.key as keyof typeof preferences.categories]}
                        onChange={(e) => updateCategory(cat.key as any, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative"></div>
                    </label>
                  </div>
                ))}
             </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white/80 uppercase tracking-wider">Quiet Hours</h4>
            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Enable Quiet Hours</div>
                  <div className="text-xs text-white/50">Pause notifications during specific times</div>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={(e) => toggleQuietHours(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative"></div>
                </label>
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={preferences.quietHours.start}
                      onChange={(e) => updateQuietHoursTime('start', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">End Time</label>
                    <input 
                      type="time" 
                      value={preferences.quietHours.end}
                      onChange={(e) => updateQuietHoursTime('end', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
