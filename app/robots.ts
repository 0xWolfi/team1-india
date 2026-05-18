import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://india.team1.network';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/core/', '/member/'], // Disallow internal dashboards
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
