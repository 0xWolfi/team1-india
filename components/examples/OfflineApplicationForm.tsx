'use client';
import React, { useState, useEffect } from 'react';
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import { BackgroundSyncManager } from '@/lib/backgroundSync';
import { useConflictResolution } from '@/lib/conflictResolution';
import { ConflictResolutionModal } from '@/components/ConflictResolutionModal';
import { trackEvent } from '@/lib/offlineAnalytics';

/**
 * Example: Application Form with Full Offline-First Integration
 * 
 * Features:
 * - Draft auto-save (2s debounce)
 * - Optimistic UI updates
 * - Offline queueing
 * - Conflict resolution
 * - Analytics tracking (offline buffered)
 */

interface ApplicationFormData {
  name: string;
  email: string;
  reason: string;
  experience: string;
}

export function OfflineApplicationForm() {
  const [formData, setFormData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    reason: '',
    experience: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Draft auto-save
  const { saveDraft, clearDraft, hasDraft } = useDraftAutoSave<ApplicationFormData>({
    formType: 'application',
    debounceMs: 2000,
    onDraftRestored: (data) => {
      setFormData(data);
      console.log('✅ Draft restored');
    },
  });

  // Conflict resolution
  const { conflict, checkConflict, resolve, autoResolve } = useConflictResolution<any>();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (field: keyof ApplicationFormData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Auto-save draft
    saveDraft(newData);

    // Track field interaction (offline buffered)
    trackEvent('form_field_edited', {
      form: 'application',
      field,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      if (isOnline) {
        // Online: Try immediate submission
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.status === 409) {
          // Conflict detected
          const { serverData } = await response.json();
          const hasConflict = checkConflict(serverData, formData);

          if (hasConflict) {
            // Show conflict resolution modal
            return; // Modal will handle resolution
          }
        }

        if (!response.ok) {
          throw new Error('Submission failed');
        }

        // Success - clear draft and reset form
        await clearDraft();
        setFormData({ name: '', email: '', reason: '', experience: '' });
        setSubmitStatus('success');

        // Track success
        trackEvent('application_submitted', {
          method: 'online',
        });
      } else {
        // Offline: Queue for later
        await BackgroundSyncManager.queueRequest('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        // Clear draft (will sync when online)
        await clearDraft();
        setSubmitStatus('success');

        // Track offline submission
        trackEvent('application_queued', {
          method: 'offline',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');

      trackEvent('application_error', {
        error: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConflictResolve = async (resolvedData: any) => {
    // Resubmit with resolved data
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Conflict-Resolution': 'true',
        },
        body: JSON.stringify(resolvedData),
      });

      if (response.ok) {
        await clearDraft();
        setFormData({ name: '', email: '', reason: '', experience: '' });
        setSubmitStatus('success');
        resolve({ strategy: 'merge', data: resolvedData });

        trackEvent('conflict_resolved', {
          strategy: 'manual',
        });
      }
    } catch (error) {
      console.error('Resolution submission error:', error);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 bg-zinc-900 border border-white/10 rounded-xl">
        {/* Status indicators */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Application Form</h2>
          
          <div className="flex items-center gap-3">
            {/* Online status */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-zinc-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Draft indicator */}
            {hasDraft && (
              <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                ✅ Draft saved
              </div>
            )}
          </div>
        </div>

        {/* Offline mode notice */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded text-sm text-orange-400">
            📴 You're offline. Your submission will be queued and sent when you're back online.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Why do you want to join?
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white h-24"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Experience</label>
            <textarea
              value={formData.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-white h-24"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white py-3 rounded font-medium transition"
          >
            {isSubmitting ? 'Submitting...' : isOnline ? 'Submit Application' : 'Queue for Submission'}
          </button>

          {/* Status messages */}
          {submitStatus === 'success' && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
              ✅ {isOnline ? 'Application submitted successfully!' : 'Application queued for submission'}
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              ❌ Submission failed. Please try again.
            </div>
          )}
        </form>

        {/* Dev info */}
        <div className="mt-6 pt-6 border-t border-white/10 text-xs text-zinc-500">
          <div className="font-bold mb-2">Offline-First Features Active:</div>
          <ul className="space-y-1">
            <li>✅ Draft auto-save (2s debounce)</li>
            <li>✅ Offline queueing</li>
            <li>✅ Conflict resolution</li>
            <li>✅ Analytics buffering</li>
          </ul>
        </div>
      </div>

      {/* Conflict resolution modal */}
      <ConflictResolutionModal
        conflict={conflict}
        onResolve={handleConflictResolve}
        onCancel={() => resolve({ strategy: 'use-local', data: formData })}
      />
    </>
  );
}
