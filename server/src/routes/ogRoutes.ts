import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { Tenant } from '../models/Tenant';
import { env } from '../config/env';
import { format } from 'date-fns';

const router = Router();

// GET /og/:orgSlug/events/:slug
// Social media crawlers (WhatsApp, Facebook, Telegram) hit this URL.
// Real users are redirected instantly to the Vercel SPA.
router.get('/:orgSlug/events/:slug', async (req: Request, res: Response): Promise<void> => {
  const { orgSlug, slug } = req.params;
  const clientUrl = env.CLIENT_URL;
  const targetUrl = `${clientUrl}/${orgSlug}/events/${slug}/register`;

  try {
    const tenant = await Tenant.findOne({ slug: orgSlug, status: 'active' }).lean();
    const event = await Event.findOne({ slug, status: 'published' }).lean();

    if (!event) {
      res.redirect(302, targetUrl);
      return;
    }

    const orgName = tenant?.name ?? 'EventHub';
    const logoUrl = tenant?.logoUrl ?? `${clientUrl}/Event Hub.png`;

    const title = `${event.name} — ${orgName}`;
    const dateStr = format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy · h:mm a');
    const fee = (event.registrationFee as number) === 0
      ? 'Free Entry'
      : `LKR ${(event.registrationFee as number).toLocaleString()}`;

    const description = [
      `📅 ${dateStr}`,
      `📍 ${event.venue}`,
      `🎟️ ${fee}`,
      event.description?.slice(0, 150) ?? '',
    ].filter(Boolean).join('  ·  ');

    const image = (event.bannerImage as string | undefined) ?? logoUrl;

    // Detect social media crawlers
    const ua = req.headers['user-agent'] ?? '';
    const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|vkShare|Pinterest|Googlebot/i.test(ua);

    if (!isCrawler) {
      res.redirect(302, targetUrl);
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  <title>${title}</title>

  <!-- Open Graph (used by WhatsApp, Facebook, Telegram, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${targetUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${orgName}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <p>Redirecting to <a href="${targetUrl}">${title}</a>…</p>
</body>
</html>`);
  } catch {
    res.redirect(302, targetUrl);
  }
});

export default router;
