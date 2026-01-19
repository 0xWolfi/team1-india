/**
 * Draft Auto-Save Hook
 * Automatically saves form data as user types
 */

import { useEffect, useCallback, useState } from 'react';
import offlineStorage from '@/lib/offlineStorage';

interface UseDraftAutoSaveOptions {
  formType: string;
  debounceMs?: number;
  onDraftRestored?: (data: any) => void;
}

export function useDraftAutoSave<T>({
  formType,
  debounceMs = 2000,
  onDraftRestored,
}: UseDraftAutoSaveOptions) {
  const [hasDraft, setHasDraft] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [formType]);

  const loadDraft = async () => {
    const draft = await offlineStorage.getDraft(formType);
    
    if (draft) {
      setHasDraft(true);
      onDraftRestored?.(draft.data);
      console.log(`📄 Restored draft for ${formType}`);
    }
  };

  const saveDraft = useCallback(async (data: T) => {
    await offlineStorage.saveDraft(formType, data);
    setHasDraft(true);
    console.log(`💾 Auto-saved draft for ${formType}`);
  }, [formType]);

  const debouncedSave = useCallback((data: T) => {
    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(() => {
      saveDraft(data);
    }, debounceMs);

    setSaveTimeout(timeout);
  }, [saveDraft, debounceMs]);

  const clearDraft = async () => {
    const draft = await offlineStorage.getDraft(formType);
    if (draft) {
      await offlineStorage.deleteDraft(draft.id);
      setHasDraft(false);
      console.log(`🗑️ Cleared draft for ${formType}`);
    }
  };

  return {
    saveDraft: debouncedSave,
    clearDraft,
    hasDraft,
    loadDraft,
  };
}

/**
 * Example Usage:
 * 
 * function ApplicationForm() {
 *   const [formData, setFormData] = useState({});
 *   const { saveDraft, clearDraft, hasDraft } = useDraftAutoSave({
 *     formType: 'application',
 *     onDraftRestored: (data) => setFormData(data),
 *   });
 * 
 *   const handleChange = (updates) => {
 *     const newData = { ...formData, ...updates };
 *     setFormData(newData);
 *     saveDraft(newData); // Auto-saves after 2s
 *   };
 * 
 *   const handleSubmit = async () => {
 *     await submitApplication(formData);
 *     clearDraft(); // Clear draft on success
 *   };
 * 
 *   return (
 *     <>
 *       {hasDraft && <div>Draft restored</div>}
 *       <input onChange={(e) => handleChange({ name: e.target.value })} />
 *     </>
 *   );
 * }
 */
