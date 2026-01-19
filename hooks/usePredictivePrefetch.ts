'use client';
import { useEffect } from 'react';

/**
 * Predictive Prefetching Hook
 * Prefetches pages on link hover and viewport intersection
 */
export function usePredictivePrefetch() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    // Prefetch on hover
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        
        // Only prefetch internal links
        if (url.origin === window.location.origin) {
          prefetchPage(url.pathname);
        }
      }
    };

    // Intersection Observer for viewport prefetching
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            if (link.href) {
              const url = new URL(link.href);
              if (url.origin === window.location.origin) {
                // Prefetch when 50% visible
                if (entry.intersectionRatio >= 0.5) {
                  prefetchPage(url.pathname);
                }
              }
            }
          }
        });
      },
      { threshold: [0.5] }
    );

    // Attach hover listeners
    document.addEventListener('mouseover', handleMouseEnter);

    // Observe important links (below-the-fold content)
    const observeLinks = () => {
      const links = document.querySelectorAll('a[href^="/"][data-prefetch="true"]');
      links.forEach((link) => observer.observe(link));
    };

    observeLinks();

    // Re-observe on route changes
    const mutationObserver = new MutationObserver(observeLinks);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener('mouseover', handleMouseEnter);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

/**
 * Prefetch a page by creating a hidden link and triggering Next.js prefetch
 */
function prefetchPage(pathname: string) {
  // Check if already prefetched
  if (prefetchedPages.has(pathname)) {
    return;
  }

  // Mark as prefetched
  prefetchedPages.add(pathname);

  // Use Next.js router prefetch if available
  if (window.next?.router) {
    (window.next.router as any).prefetch(pathname);
  } else {
    // Fallback: Create hidden link to trigger browser prefetch
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = pathname;
    link.as = 'document';
    document.head.appendChild(link);

    // Also fetch the page to warm up cache
    fetch(pathname, {
      method: 'GET',
      credentials: 'same-origin',
    }).catch(() => {
      // Silently fail - prefetch is optional
    });
  }

  console.log(`🔮 Prefetched: ${pathname}`);
}

// Track prefetched pages to avoid duplicates
const prefetchedPages = new Set<string>();

// Extend window type for Next.js router
declare global {
  interface Window {
    next?: {
      router?: any;
    };
  }
}
