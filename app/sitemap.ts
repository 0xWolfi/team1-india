import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { safeBuildFetch } from '@/lib/safeStaticParams';

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
    '/speedrun',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Routes: Public Playbooks
  const playbooks = await safeBuildFetch(
    () =>
      prisma.playbook.findMany({
        where: { visibility: 'PUBLIC', deletedAt: null },
        select: { id: true, updatedAt: true },
      }),
    'sitemap playbooks'
  );

  const playbookRoutes = playbooks.map((item) => ({
    url: `${baseUrl}/public/playbooks/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic Routes: Public Events (Guides of type EVENT)
  const events = await safeBuildFetch(
    () =>
      prisma.guide.findMany({
        where: { visibility: 'PUBLIC', type: 'event', deletedAt: null },
        select: { id: true, updatedAt: true },
      }),
    'sitemap events'
  );

  const eventRoutes = events.map((item) => ({
    url: `${baseUrl}/public/events/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic Routes: Speedrun runs (live + past, hide drafts)
  const speedrunRuns = await safeBuildFetch(
    () =>
      prisma.speedrunRun.findMany({
        where: {
          deletedAt: null,
          status: {
            in: [
              'registration_open',
              'submissions_open',
              'submissions_closed',
              'irl_event',
              'judging',
              'completed',
            ],
          },
        },
        select: { slug: true, updatedAt: true, isCurrent: true },
      }),
    'sitemap speedrun runs'
  );
  const speedrunRoutes = speedrunRuns.map((r) => ({
    url: `${baseUrl}/speedrun/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: r.isCurrent ? 0.9 : 0.6,
  }));

  return [...routes, ...playbookRoutes, ...eventRoutes, ...speedrunRoutes];
}
