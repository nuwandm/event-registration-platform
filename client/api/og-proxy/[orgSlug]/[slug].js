const CRAWLER_UA = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|vkShare|Pinterest|Googlebot/i;

export default async function handler(req, res) {
  const { orgSlug, slug } = req.query;

  const clientUrl = 'https://event-registration-platform-ten.vercel.app';
  const registrationUrl = `${clientUrl}/${orgSlug}/events/${slug}/register`;

  const ua = req.headers['user-agent'] ?? '';

  // Real users: redirect to the SPA
  if (!CRAWLER_UA.test(ua)) {
    res.redirect(302, registrationUrl);
    return;
  }

  // Crawlers (WhatsApp, Facebook, etc): fetch OG HTML from backend and return it
  const backendUrl = (process.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '');
  const ogUrl = `${backendUrl}/api/og/${orgSlug}/events/${slug}`;

  try {
    const upstream = await fetch(ogUrl, {
      headers: { 'user-agent': ua },
    });
    const html = await upstream.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).send(html);
  } catch {
    res.redirect(302, registrationUrl);
  }
}
