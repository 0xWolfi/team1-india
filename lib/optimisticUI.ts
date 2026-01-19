/**
 * Optimistic UI Helpers
 * Utilities for implementing optimistic updates with rollback
 */

import React from 'react';
import { BackgroundSyncManager } from './backgroundSync';
import offlineStorage from './offlineStorage';

export interface OptimisticAction<T> {
  optimisticData: T;
  endpoint: string;
  method: string;
  body: any;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: () => void) => void;
}

/**
 * Execute action with optimistic update
 */
export async function executeOptimistic<T>({
  optimisticData,
  endpoint,
  method,
  body,
  onSuccess,
  onError,
}: OptimisticAction<T>): Promise<{ success: boolean; data?: T }> {
  
  try {
    if (navigator.onLine) {
      // Online: Try immediate execution
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess?.(data);
        return { success: true, data };
      } else {
        throw new Error(`Request failed: ${response.statusText}`);
      }
    } else {
      // Offline: Queue for later
      await BackgroundSyncManager.queueRequest(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Return optimistic data
      return { success: true, data: optimisticData };
    }
  } catch (error) {
    // Provide rollback function
    const rollback = () => {
      console.log('🔄 Rolling back optimistic update');
    };

    onError?.(error as Error, rollback);
    return { success: false };
  }
}

/**
 * Optimistic list operations
 */
export class OptimisticList<T extends { id: string }> {
  constructor(private items: T[]) {}

  /**
   * Add item optimistically
   */
  async add(
    item: T,
    endpoint: string,
    onUpdate: (items: T[]) => void
  ): Promise<boolean> {
    // Optimistic update
    const updatedItems = [...this.items, item];
    onUpdate(updatedItems);

    const result = await executeOptimistic<T>({
      optimisticData: item,
      endpoint,
      method: 'POST',
      body: item,
      onError: (error, rollback) => {
        // Rollback on error
        onUpdate(this.items);
        rollback();
      },
    });

    return result.success;
  }

  /**
   * Update item optimistically
   */
  async update(
    item: T,
    endpoint: string,
    onUpdate: (items: T[]) => void
  ): Promise<boolean> {
    const originalItems = this.items;
    
    // Optimistic update
    const updatedItems = this.items.map(i => i.id === item.id ? item : i);
    onUpdate(updatedItems);

    const result = await executeOptimistic<T>({
      optimisticData: item,
      endpoint,
      method: 'PUT',
      body: item,
      onError: (error, rollback) => {
        // Rollback on error
        onUpdate(originalItems);
        rollback();
      },
    });

    return result.success;
  }

  /**
   * Delete item optimistically
   */
  async delete(
    id: string,
    endpoint: string,
    onUpdate: (items: T[]) => void
  ): Promise<boolean> {
    const originalItems = this.items;
    
    // Optimistic update
    const updatedItems = this.items.filter(i => i.id !== id);
    onUpdate(updatedItems);

    const result = await executeOptimistic({
      optimisticData: null,
      endpoint,
      method: 'DELETE',
      body: { id },
      onError: (error, rollback) => {
        // Rollback on error
        onUpdate(originalItems);
        rollback();
      },
    });

    return result.success;
  }
}

/**
 * React Hook for optimistic updates
 */
export function useOptimisticList<T extends { id: string }>(initialItems: T[]) {
  const [items, setItems] = React.useState(initialItems);
  const optimisticList = new OptimisticList(items);

  return {
    items,
    add: (item: T, endpoint: string) => 
      optimisticList.add(item, endpoint, setItems),
    update: (item: T, endpoint: string) => 
      optimisticList.update(item, endpoint, setItems),
    delete: (id: string, endpoint: string) => 
      optimisticList.delete(id, endpoint, setItems),
  };
}
