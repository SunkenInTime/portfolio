/*
  Cloudflare Pages Function: GET /api/art?u=<spotify image url>
  Same-origin proxy for album art so the page can read its pixels for the tint.
*/

const ALLOWED = /^https:\/\/(i\.scdn\.co|image-cdn-[a-z]+\.spotifycdn\.com|mosaic\.scdn\.co)\//;

export async function onRequestGet({ request }) {
  const u = new URL(request.url).searchParams.get('u') || '';
  if (!ALLOWED.test(u)) return new Response('bad art url', { status: 400 });
  const r = await fetch(u, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!r.ok) return new Response('art fetch failed', { status: 502 });
  return new Response(r.body, { status: 200, headers: { 'content-type': r.headers.get('content-type') || 'image/jpeg', 'cache-control': 'public, max-age=86400' } });
}
