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
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50 overflow-hidden ring-1 ring-white/10"
      >
        
        <div className="flex items-start gap-4 relative">
          <div className="p-3 bg-white/10 rounded-xl text-white">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">Enable Notifications</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Stay updated on your application status, experiments, and community announcements.
            </p>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="text-xs font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                {loading ? 'Enabling...' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button 
             onClick={handleDismiss}
             className="text-zinc-500 hover:text-white transition-colors absolute top-0 right-0 p-1"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
