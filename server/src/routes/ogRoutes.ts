import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { env } from '../config/env';
import { format } from 'date-fns';

const router = Router();

// GET /og/events/:slug
// Social media crawlers (WhatsApp, Facebook, Twitter) hit this URL.
// Real users are redirected instantly to the Vercel SPA.
router.get('/events/:slug', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const clientUrl = env.CLIENT_URL;
  const targetUrl = `${clientUrl}/events/${slug}`;

  try {
    const event = await Event.findOne({ slug, status: 'published' }).lean();

    if (!event) {
      res.redirect(302, targetUrl);
      return;
    }

    const title = event.name;
    const description = event.description?.slice(0, 200) ?? 'Register for this event on EventHub';
    const image = event.bannerImage ?? `${clientUrl}/Event Hub.png`;
    const dateStr = format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy · h:mm a');
    const fullDesc = `📅 ${dateStr}  📍 ${event.venue}  ${description}`;

    // Detect social media crawlers by User-Agent
    const ua = req.headers['user-agent'] ?? '';
    const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Slackbot|Discordbot|vkShare|Pinterest|Googlebot/i.test(ua);

    if (!isCrawler) {
      res.redirect(302, targetUrl);
      return;
    }

    // Serve OG HTML to crawlers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${targetUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${fullDesc}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="EventHub" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${fullDesc}" />
  <meta name="twitter:image" content="${image}" />

  <!-- WhatsApp uses og: tags — no extra tags needed -->
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
