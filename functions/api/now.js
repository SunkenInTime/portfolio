/*
  Cloudflare Pages Function: GET /api/now
  Returns what Dara is playing on Spotify right now, or { playing: false }.
  Secrets (Pages project → Settings → Variables and Secrets):
    SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
  The refresh token comes from the one-time OAuth run in dev/serve.mjs (/auth), scope user-read-currently-playing.
*/

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function accessToken(env) {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`) },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('refresh failed');
  return j.access_token;
}

// Spotify closed audio-features to apps created after Nov 2024. ReccoBeats mirrors them for mainstream
// tracks (keyed by Spotify id, no key needed); Deezer's public track endpoint has a bpm sometimes and a
// 30 s preview always, which the page can analyse itself when no bpm is known.
async function deezerFind(track, artist) {
  const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(artist + ' ' + track)}&limit=3`); if (!r.ok) return null;
  const j = await r.json(); const hits = j.data || []; if (!hits.length) return null;
  const want = track.toLowerCase(); const h = hits.find((x) => x.title.toLowerCase() === want) || hits[0];
  const t = await fetch(`https://api.deezer.com/track/${h.id}`).then((x) => (x.ok ? x.json() : null)).catch(() => null);
  return { bpm: t && t.bpm > 0 ? Math.round(t.bpm) : null, preview: (t && t.preview) || h.preview || null };
}
const featureCache = new Map(); // track id → features; lives as long as the isolate does
async function features(id, track, artist) {
  if (featureCache.has(id)) return featureCache.get(id);
  const out = { bpm: null, energy: null, preview: null };
  try { const r = await fetch(`https://api.reccobeats.com/v1/audio-features?ids=${id}`); if (r.ok) { const j = await r.json(); const f = j.content && j.content[0]; if (f && f.tempo) { out.bpm = Math.round(f.tempo); out.energy = f.energy; } } } catch { /* optional */ }
  try { const d = await deezerFind(track, artist.split(', ')[0]); if (d) { if (d.preview) out.preview = '/api/preview?u=' + encodeURIComponent(d.preview); if (!out.bpm && d.bpm) { out.bpm = d.bpm; out.energy = Math.max(.2, Math.min(.95, (d.bpm - 70) / 110)); } } } catch { /* optional */ }
  featureCache.set(id, out); return out;
}

export async function onRequestGet({ env }) {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) return json({ playing: false, error: 'not configured' });
  try {
    const token = await accessToken(env);
    const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track', { headers: { authorization: `Bearer ${token}` } });
    if (r.status === 204) return json({ playing: false });
    if (!r.ok) return json({ playing: false, error: 'spotify ' + r.status });
    const j = await r.json();
    if (!j.item || j.currently_playing_type !== 'track') return json({ playing: false });
    const art = (j.item.album.images || []).sort((a, b) => b.width - a.width)[0]?.url || null;
    const artist = j.item.artists.map((a) => a.name).join(', ');
    const f = await features(j.item.id, j.item.name, artist);
    return json({
      playing: !!j.is_playing,
      id: j.item.id,
      track: j.item.name,
      artist: j.item.artists.map((a) => a.name).join(', '),
      album: j.item.album.name,
      art,
      progress_ms: j.progress_ms,
      duration_ms: j.item.duration_ms,
      url: j.item.external_urls?.spotify || null,
      bpm: f.bpm, energy: f.energy, preview: f.preview,
    });
  } catch (e) {
    return json({ playing: false, error: e.message });
  }
}
