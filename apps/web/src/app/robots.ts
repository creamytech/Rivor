import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/app/*',
        '/auth/callback/*',
        '/onboarding/',
        '/_next/',
        '/admin/',
      ],
    },
    sitemap: 'https://rivor.example.com/sitemap.xml',
  }
}
