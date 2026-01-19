import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://team1india.com'; // Hardcoded based on project knowledge

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/core/', '/member/'], // Disallow internal dashboards
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
