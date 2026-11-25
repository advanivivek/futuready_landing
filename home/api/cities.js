// GET /api/cities: every Futuready city, as { cities: [...], virtual }. Vercel runs this at most about once every
// 10 minutes per region and serves the saved answer to everyone else (and an older one if the sources are down),
// so even a big rush of visitors costs almost nothing and never reaches Hack2skill or the Google Sheet directly.
import { allCities } from '../src/live-cities.js';

export default async function handler(req, res) {
  let body;
  try {
    body = await allCities();
  } catch (e) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: String(e?.message || e) }));
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // browsers keep it 5 minutes; Vercel's edge keeps it 10, then refreshes it in the background
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=600, stale-while-revalidate=86400, stale-if-error=86400');
  res.end(JSON.stringify(body));
}
