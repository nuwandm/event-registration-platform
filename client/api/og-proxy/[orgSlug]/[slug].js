// Vercel Serverless Function: proxies social crawler requests to the backend OG endpoint.
// Vercel deploys this at /api/og-proxy/:orgSlug/:slug
// vercel.json routes crawler UA requests for /:orgSlug/events/:slug/register here.
export default async function handler(req, res) {
  const { orgSlug, slug } = req.query;

  const backendUrl = process.env.VITE_API_URL
    ? process.env.VITE_API_URL.replace(/\/api$/, '')
    : 'http://localhost:5000';

  const ogUrl = `${backendUrl}/api/og/${orgSlug}/events/${slug}`;

  try {
    const upstream = await fetch(ogUrl, {
      headers: { 'user-agent': req.headers['user-agent'] ?? 'Vercel-OG-Proxy' },
    });
    const html = await upstream.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(upstream.status).send(html);
  } catch {
    res.redirect(302, `${process.env.VITE_CLIENT_URL ?? ''}/${orgSlug}/events/${slug}/register`);
  }
}
