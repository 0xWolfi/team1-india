'use client';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';

/**
 * PrefetchProvider - Enables predictive prefetching across the app
 * Add this to your root layout to enable hover and viewport prefetching
 */
export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  usePredictivePrefetch();
  
  return <>{children}</>;
}

/**
 * Usage in app/layout.tsx:
 * 
 * import { PrefetchProvider } from '@/components/PrefetchProvider';
 * 
 * <PrefetchProvider>
 *   {children}
 * </PrefetchProvider>
 * 
 * For manual prefetch control, add data-prefetch="true" to links:
 * <Link href="/public" data-prefetch="true">Public Page</Link>
 */
