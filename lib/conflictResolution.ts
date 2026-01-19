/**
 * Conflict Resolution UI Helper
 * Handles merge conflicts when server data differs from local changes
 */

export interface ConflictData<T> {
  serverVersion: T;
  localVersion: T;
  serverTimestamp: number;
  localTimestamp: number;
  conflictFields: string[];
}

export type ConflictResolution<T> = 
  | { strategy: 'use-server'; data: T }
  | { strategy: 'use-local'; data: T }
  | { strategy: 'merge'; data: T };

/**
 * Detect conflicts between server and local data
 */
export function detectConflicts<T extends Record<string, any>>(
  serverData: T,
  localData: T,
  excludeFields: string[] = ['id', 'createdAt']
): string[] {
  const conflicts: string[] = [];

  Object.keys(localData).forEach(key => {
    if (excludeFields.includes(key)) return;

    const serverValue = serverData[key];
    const localValue = localData[key];

    if (JSON.stringify(serverValue) !== JSON.stringify(localValue)) {
      conflicts.push(key);
    }
  });

  return conflicts;
}

/**
 * Auto-merge strategy for simple conflicts
 */
export function autoMerge<T extends Record<string, any>>(
  serverData: T,
  localData: T,
  conflictFields: string[]
): T {
  const merged: any = { ...serverData };

  conflictFields.forEach(field => {
    // Strategy: Prefer non-empty values
    if (!serverData[field] && localData[field]) {
      merged[field] = localData[field];
    } else if (serverData[field] && !localData[field]) {
      merged[field] = serverData[field];
    } else {
      // Both have values - prefer most recent
      const serverTime = (serverData as any).updatedAt || 0;
      const localTime = (localData as any).updatedAt || Date.now();
      
      merged[field] = localTime > serverTime ? localData[field] : serverData[field];
    }
  });

  return merged as T;
}

/**
 * React Hook for conflict resolution
 */
import { useState } from 'react';

export function useConflictResolution<T extends Record<string, any>>() {
  const [conflict, setConflict] = useState<ConflictData<T> | null>(null);

  const checkConflict = (serverData: T, localData: T): ConflictData<T> | null => {
    const conflictFields = detectConflicts(serverData, localData);

    if (conflictFields.length === 0) return null;

    const conflictData: ConflictData<T> = {
      serverVersion: serverData,
      localVersion: localData,
      serverTimestamp: (serverData as any).updatedAt || Date.now(),
      localTimestamp: (localData as any).updatedAt || Date.now(),
      conflictFields,
    };

    setConflict(conflictData);
    return conflictData;
  };

  const resolve = (resolution: ConflictResolution<T>) => {
    setConflict(null);
    return resolution.data;
  };

  const autoResolve = (serverData: T, localData: T, conflictFields: string[]) => {
    const merged = autoMerge(serverData, localData, conflictFields);
    return resolve({ strategy: 'merge', data: merged });
  };

  return {
    conflict,
    checkConflict,
    resolve,
    autoResolve,
    hasConflict: conflict !== null,
  };
}
