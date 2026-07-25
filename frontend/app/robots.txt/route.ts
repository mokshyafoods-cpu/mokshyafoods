export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mokshyafood.com.np';
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
