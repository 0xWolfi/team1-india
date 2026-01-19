import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Team1 India',
    short_name: 'Team1',
    description: 'Community of builders, innovators, and change-makers.',
    start_url: '/public',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    categories: ['productivity', 'business', 'social'],
    icons: [
      {
        src: '/pwa-icons/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icons/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icons/icon-maskable',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
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
        src: "/pwa-icons/screenshot-narrow",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Team1 India Mobile App"
      },
    ]
  };
}
