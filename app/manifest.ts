import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Team1 India',
    short_name: 'Team1',
    description: 'Community of builders, innovators, and change-makers.',
    start_url: '/public',  // ✅ Public-first entry point
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    categories: ['productivity', 'business', 'social'],
    icons: [
      {
        src: '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',  // ✅ Standard icon without padding
      },
      {
        src: '/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/t1-logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      }
    ],
    shortcuts: [
      {
        name: "Public Home",
        url: "/public",
        description: "View public resources and updates",
      },
      {
        name: "Core Dashboard",
        url: "/core",
        description: "Access internal tools",
      },
    ],
    screenshots: [
        {
            src: "/og-image.png",
            sizes: "1200x630",
            type: "image/png",
            label: "Team1 India Dashboard"
        }
    ]
  };
}
