import { getSiteUrl } from '@/lib/seo';

export async function GET() {
  const siteUrl = getSiteUrl();
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /api
Disallow: /cart
Disallow: /checkout
Disallow: /auth
Disallow: /wishlist
Disallow: /orders

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
