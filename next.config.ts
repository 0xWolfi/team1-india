import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.vercel.app https://vercel.com https://*.public.blob.vercel-storage.com https://public-api.luma.com https://vitals.vercel-insights.com",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.lu.ma',
      },
      {
        protocol: 'https',
        hostname: 'images.lu.ma',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'jvribvzirutackel.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 30, // Cache dynamic routes for 30s client-side
      static: 180, // Cache static routes for 3m client-side
    },
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: false,  // ✅ Wait for user consent via PWAUpdatePrompt
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",  // ✅ Offline fallback page
  },
  runtimeCaching: [
    // Public API - NetworkFirst with 1hr TTL
    {
      urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/api\/public\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'public-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
        plugins: [
          {
            // Explicit header validation - never cache sensitive headers
            cacheWillUpdate: async ({ response }: { response: Response }) => {
              const headers = response.headers;
              
              // Never cache if auth headers present
              if (headers.get('Authorization') || headers.get('Set-Cookie')) {
                console.warn('Blocked caching response with auth headers');
                return null;  // Don't cache
              }
              
              // Only cache successful responses
              if (!response.ok && response.status !== 304) {
                return null;
              }
              
              return response;
            },
          },
          {
            // Cache quota monitoring
            cacheDidUpdate: async () => {
              if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const { usage, quota } = await navigator.storage.estimate();
                if (usage && quota && usage / quota > 0.9) {
                  console.warn(`⚠️ Cache quota at ${((usage / quota) * 100).toFixed(1)}%`);
                }
              }
            },
          },
        ],
      },
    },
    // Core/Member API - NetworkOnly (never cache authenticated data)
    {
      urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/api\/(core|member|auth)\/.*/i,
      handler: 'NetworkOnly',
    },
    // Vercel Blob images - always fetch fresh (avoid opaque cached responses)
    {
      urlPattern: /^https:\/\/.*\.public\.blob\.vercel-storage\.com\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'NetworkOnly',
    },
    // Images - CacheFirst with 30 days
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Static JS/CSS - StaleWhileRevalidate
    {
      urlPattern: /\.(js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // Route-Based Caching: Core Dashboard (Fresh data required)
    {
      urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/core.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'core-pages',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 5 * 60, // 5 minutes - shorter TTL for dashboard
        },
        networkTimeoutSeconds: 5, // Fast timeout for dashboard
      },
    },
    // Route-Based Caching: Public Pages (Stale acceptable)
    {
      urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/public.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'public-pages',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    // Route-Based Caching: Playbooks (Longer cache for static content)
    {
      urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/(public\/playbooks|playbooks).*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'playbooks-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
  workboxOptions: {
    importScripts: ['/push-sw.js'],
  },
});

export default withPWA(nextConfig);
