/*
  Cloudflare Pages Function: GET /api/preview?u=<deezer preview mp3 url>
  Same-origin proxy for the 30 s preview so the page can decode it and estimate the tempo.
*/

export async function onRequestGet({ request }) {
  const u = new URL(request.url).searchParams.get('u') || '';
  let host = ''; try { host = new URL(u).hostname; } catch { /* bad url */ }
  if (!u.startsWith('https://') || !host.endsWith('.dzcdn.net')) return new Response('bad preview url', { status: 400 });
  const r = await fetch(u, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!r.ok) return new Response('preview fetch failed', { status: 502 });
  return new Response(r.body, { status: 200, headers: { 'content-type': r.headers.get('content-type') || 'audio/mpeg', 'cache-control': 'public, max-age=86400' } });
}
