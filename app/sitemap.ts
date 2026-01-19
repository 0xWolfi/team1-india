import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://team1india.com';

  // Static Routes
  const routes = [
    '',
    '/public',
    '/public/events',
    '/public/playbooks',
    '/public/programs',
    '/public/content',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Routes: Public Playbooks
  const playbooks = await prisma.playbook.findMany({
    where: { visibility: 'PUBLIC', deletedAt: null },
    select: { id: true, updatedAt: true },
  });

  const playbookRoutes = playbooks.map((item) => ({
    url: `${baseUrl}/public/playbooks/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic Routes: Public Events (Guides of type EVENT)
  const events = await prisma.guide.findMany({
    where: { visibility: 'PUBLIC', type: 'event', deletedAt: null },
    select: { id: true, updatedAt: true },
  });

  const eventRoutes = events.map((item) => ({
    url: `${baseUrl}/public/events/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...playbookRoutes, ...eventRoutes];
}
