"use client";

import React, { useState, useEffect } from 'react';
import { usePushSubscription } from '@/lib/pushSubscription';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

export const NotificationPermissionPrompt = ({ userId }: { userId?: string }) => {
  const { isSupported, permission, subscribe, loading, isMobile } = usePushSubscription(userId);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt if supported, usually not granted/denied yet (default),
    // and hasn't been dismissed recently (can check local storage)
    if (isSupported && isMobile && permission === 'default') {
      const dismissedAt = localStorage.getItem('notification-prompt-dismissed');
      if (!dismissedAt || Date.now() - parseInt(dismissedAt) > 7 * 24 * 60 * 60 * 1000) {
        // Show after a delay
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, isMobile, permission]);

  const handleSubscribe = async () => {
    await subscribe();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  if (!isVisible || !isMobile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/50 backdrop-blur-xl border border-zinc-200/50 rounded-xl shadow-2xl p-4 z-50 overflow-hidden ring-1 ring-black/5"
      >
        
        <div className="flex items-start gap-4 relative">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-zinc-900">Enable Notifications</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Stay updated on your application status, experiments, and community announcements.
            </p>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                {loading ? 'Enabling...' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button 
             onClick={handleDismiss}
             className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
