// Local Spotify bridge (plus static files from the repo root), proxied by `tailscale serve` on 10005.
// Run:  node dev/serve.mjs   (from the repo root or anywhere)
//
// Spotify setup, once:
//   1. https://developer.spotify.com/dashboard → create an app. Redirect URIs (add both):
//        http://127.0.0.1:4399/callback
//        https://dara-pc-duo.tailba589e.ts.net:10005/callback
//   2. Open /setup on this server, paste the app's Client ID and Client Secret, submit.
//   3. You are sent to Spotify to approve read-only playback access; tokens land in dev/.spotify.json (gitignored).
//   4. /api/now then returns what you are playing. The mocks' "live" button polls it.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SECRETS = path.join(here, '.spotify.json');
const PORT = 4399;
const SCOPES = 'user-read-currently-playing user-read-playback-state';
const mime = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.json': 'application/json', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };

const readSecrets = () => { try { return JSON.parse(fs.readFileSync(SECRETS, 'utf8')); } catch { return {}; } };
const writeSecrets = (o) => fs.writeFileSync(SECRETS, JSON.stringify(o, null, 2));
const send = (res, code, body, type = 'text/html; charset=utf-8') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
const redirectUri = (req) => { const host = req.headers.host || `127.0.0.1:${PORT}`; const https = !host.startsWith('127.0.0.1') && !host.startsWith('localhost'); return `${https ? 'https' : 'http'}://${host}/callback`; };
const page = (title, body) => `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{font:15px/1.5 system-ui;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#141414;background:#f4f4f1}input{width:100%;padding:.5rem;font:inherit;margin:.25rem 0 1rem;border:1px solid #ccc}button{font:inherit;padding:.5rem 1rem;border:1px solid #141414;background:#141414;color:#fff;cursor:pointer}code{background:#e8e8e3;padding:0 .3em}</style>${body}`;

let tokenCache = { access: null, exp: 0 };
async function accessToken() {
  const s = readSecrets();
  if (!s.client_id || !s.client_secret) throw new Error('not set up: open /setup');
  if (!s.refresh_token) throw new Error('not connected: open /auth');
  if (tokenCache.access && Date.now() < tokenCache.exp - 30000) return tokenCache.access;
  const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: 'Basic ' + Buffer.from(`${s.client_id}:${s.client_secret}`).toString('base64') }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: s.refresh_token }) });
  const j = await r.json();
  if (!j.access_token) throw new Error('refresh failed: ' + (j.error_description || j.error || r.status));
  if (j.refresh_token) writeSecrets({ ...s, refresh_token: j.refresh_token });
  tokenCache = { access: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return j.access_token;
}

const featureCache = new Map(); // track id → {bpm, energy, source} or null
// Spotify closed audio-features to apps created after Nov 2024, so fall back to Deezer, whose public
// track endpoint carries a bpm (0 when Deezer has none). Energy is not available anywhere free; we
// estimate it from bpm when Spotify did not give one.
async function deezerFind(track, artist) {
  const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(artist + ' ' + track)}&limit=3`); if (!r.ok) return null;
  const j = await r.json(); const hits = j.data || []; if (!hits.length) return null;
  const want = track.toLowerCase(); const h = hits.find(x => x.title.toLowerCase() === want) || hits[0];
  const t = await fetch(`https://api.deezer.com/track/${h.id}`).then(x => x.ok ? x.json() : null).catch(() => null);
  return { bpm: t && t.bpm > 0 ? Math.round(t.bpm) : null, preview: (t && t.preview) || h.preview || null };
}
async function features(id, token, track, artist) {
  if (featureCache.has(id)) return featureCache.get(id);
  let out = { bpm: null, energy: null, source: 'unavailable', preview: null };
  try { const r = await fetch(`https://api.spotify.com/v1/audio-features/${id}`, { headers: { authorization: `Bearer ${token}` } }); if (r.ok) { const j = await r.json(); out = { ...out, bpm: Math.round(j.tempo), energy: j.energy, source: 'spotify' }; } } catch {}
  // ReccoBeats mirrors Spotify's audio features for anything mainstream, keyed by Spotify track id, no key needed.
  if (!out.bpm) { try { const r = await fetch(`https://api.reccobeats.com/v1/audio-features?ids=${id}`); if (r.ok) { const j = await r.json(); const f = j.content && j.content[0]; if (f && f.tempo) out = { ...out, bpm: Math.round(f.tempo), energy: f.energy, source: 'reccobeats' }; } } catch {} }
  try { const d = await deezerFind(track, artist.split(', ')[0]); if (d) { if (d.preview) out.preview = '/api/preview?u=' + encodeURIComponent(d.preview); if (!out.bpm && d.bpm) { out.bpm = d.bpm; out.energy = Math.max(.2, Math.min(.95, (d.bpm - 70) / 110)); out.source = 'deezer'; } } } catch {}
  featureCache.set(id, out); return out;
}

async function now() {
  const token = await accessToken();
  const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track', { headers: { authorization: `Bearer ${token}` } });
  if (r.status === 204) return { playing: false };
  if (!r.ok) throw new Error('spotify ' + r.status);
  const j = await r.json();
  if (!j.item || j.currently_playing_type !== 'track') return { playing: false };
  const f = await features(j.item.id, token, j.item.name, j.item.artists.map(a => a.name).join(', '));
  const art = (j.item.album.images || []).sort((a, b) => b.width - a.width)[0]?.url || null;
  return { playing: !!j.is_playing, id: j.item.id, track: j.item.name, artist: j.item.artists.map(a => a.name).join(', '), album: j.item.album.name, art, progress_ms: j.progress_ms, duration_ms: j.item.duration_ms, url: j.item.external_urls?.spotify, bpm: f?.bpm ?? null, energy: f?.energy ?? null, features: f?.source ?? 'unavailable', preview: f?.preview ?? null };
}

const readBody = (req) => new Promise(res => { let b = ''; req.on('data', c => b += c); req.on('end', () => res(b)); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const p = decodeURIComponent(url.pathname);
  try {
    if (p === '/setup' && req.method === 'GET') {
      const s = readSecrets();
      return send(res, 200, page('Spotify setup', `<h1>Spotify setup</h1><p>Create an app at <a href="https://developer.spotify.com/dashboard" target="_blank">developer.spotify.com/dashboard</a> with these redirect URIs:</p><p><code>http://127.0.0.1:${PORT}/callback</code><br><code>${redirectUri(req).startsWith('https') ? redirectUri(req) : 'https://dara-pc-duo.tailba589e.ts.net:10005/callback'}</code></p><form method="post"><label>Client ID<input name="client_id" value="${s.client_id || ''}" required></label><label>Client Secret<input name="client_secret" type="password" value="${s.client_secret || ''}" required></label><button>Save and connect</button></form><p>Stored only in <code>dev/.spotify.json</code> on this machine.</p>`));
    }
    if (p === '/setup' && req.method === 'POST') {
      const f = new URLSearchParams(await readBody(req)); writeSecrets({ ...readSecrets(), client_id: f.get('client_id').trim(), client_secret: f.get('client_secret').trim(), refresh_token: null }); tokenCache = { access: null, exp: 0 };
      res.writeHead(302, { location: '/auth' }); return res.end();
    }
    if (p === '/auth') {
      const s = readSecrets(); if (!s.client_id) { res.writeHead(302, { location: '/setup' }); return res.end(); }
      const q = new URLSearchParams({ client_id: s.client_id, response_type: 'code', redirect_uri: redirectUri(req), scope: SCOPES, show_dialog: 'false' });
      res.writeHead(302, { location: 'https://accounts.spotify.com/authorize?' + q }); return res.end();
    }
    if (p === '/callback') {
      const code = url.searchParams.get('code'); const err = url.searchParams.get('error');
      if (err || !code) return send(res, 400, page('Spotify', `<h1>Not connected</h1><p>${err || 'no code'}</p><p><a href="/auth">Try again</a></p>`));
      const s = readSecrets();
      const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: 'Basic ' + Buffer.from(`${s.client_id}:${s.client_secret}`).toString('base64') }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(req) }) });
      const j = await r.json();
      if (!j.refresh_token) return send(res, 400, page('Spotify', `<h1>Token exchange failed</h1><pre>${JSON.stringify(j, null, 2)}</pre><p>Check the redirect URI is registered exactly as <code>${redirectUri(req)}</code>. <a href="/setup">Back</a></p>`));
      writeSecrets({ ...s, refresh_token: j.refresh_token }); tokenCache = { access: j.access_token, exp: Date.now() + j.expires_in * 1000 };
      return send(res, 200, page('Spotify', `<h1>Connected</h1><p>The home page shows what you are playing once the dev server points at this bridge.</p><p>Check <a href="/api/now">/api/now</a> any time.</p>`));
    }
    if (p === '/api/now') { try { return json(res, 200, await now()); } catch (e) { return json(res, 200, { playing: false, error: e.message }); } }
    if (p === '/api/preview') {
      const u = url.searchParams.get('u') || ''; let host = ''; try { host = new URL(u).hostname; } catch {} if (!u.startsWith('https://') || !host.endsWith('.dzcdn.net')) return send(res, 400, 'bad preview url', 'text/plain');
      const r = await fetch(u); if (!r.ok) return send(res, 502, 'preview fetch failed', 'text/plain');
      res.writeHead(200, { 'content-type': r.headers.get('content-type') || 'audio/mpeg', 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' }); return res.end(Buffer.from(await r.arrayBuffer()));
    }
    if (p === '/api/art') {
      const u = url.searchParams.get('u') || ''; if (!/^https:\/\/(i\.scdn\.co|image-cdn-[a-z]+\.spotifycdn\.com|mosaic\.scdn\.co)\//.test(u)) return send(res, 400, 'bad art url', 'text/plain');
      const r = await fetch(u); if (!r.ok) return send(res, 502, 'art fetch failed', 'text/plain');
      res.writeHead(200, { 'content-type': r.headers.get('content-type') || 'image/jpeg', 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' }); return res.end(Buffer.from(await r.arrayBuffer()));
    }
    // static
    let fp = p === '/' ? '/api/now' : p;
    const abs = path.normalize(path.join(root, fp));
    if (!abs.startsWith(root) || abs === SECRETS) return send(res, 403, 'forbidden', 'text/plain');
    fs.readFile(abs, (err, data) => { if (err) return send(res, 404, 'not found', 'text/plain'); res.writeHead(200, { 'content-type': mime[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(data); });
  } catch (e) { send(res, 500, 'error: ' + e.message, 'text/plain'); }
}).listen(PORT, '127.0.0.1', () => console.log(`spotify bridge up on 127.0.0.1:${PORT}, root ${root}`));
