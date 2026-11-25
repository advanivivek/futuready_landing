// The page maker at /maker is for the Futuready team only: Vercel runs this before serving anything under /maker
// and asks for a password (the browser's own sign-in box; any user name works). The password is MAKER_PASSWORD in
// Vercel (Settings, Environment Variables). Without it the maker stays shut. Runs for /maker only, never for the
// public page, so it costs nothing per visitor.
import { next } from '@vercel/functions';

export const config = { matcher: ['/maker', '/maker/:path*'] };

// compares without stopping at the first difference, so timing gives nothing away
const same = (a, b) => {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
};

const shut = (status, text, extra = {}) =>
  new Response(text, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', ...extra },
  });

export default function middleware(request) {
  const password = process.env.MAKER_PASSWORD || '';
  if (!password) return shut(503, 'The page maker is shut. Add MAKER_PASSWORD in Vercel (Settings, Environment Variables), then redeploy.');
  const [scheme, value] = (request.headers.get('authorization') || '').split(' ');
  if (scheme === 'Basic' && value) {
    let given = '';
    try {
      given = new TextDecoder().decode(Uint8Array.from(atob(value), c => c.charCodeAt(0))).split(':').slice(1).join(':');
    } catch {
      /* not readable: asked again below */
    }
    if (same(given, password)) return next();
  }
  return shut(401, 'Futuready page maker: please sign in.', { 'www-authenticate': 'Basic realm="Futuready page maker", charset="UTF-8"' });
}
