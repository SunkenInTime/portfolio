/*
  Now playing: polls /api/now (a Cloudflare Pages Function, see functions/api/now.js).
  When a track is playing, the album art's colour tints the page and the footer shows the track.
  When nothing plays, or the endpoint is missing (local dev), the page stays paper.
*/

import { estimateTempo } from './tempo.js';

const cssVar = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d);
const paper = () => cssVar('--paper', '#f7f7f4');
const tintAmount = () => parseFloat(cssVar('--tintAmount', '.06')) || .06;

export function mixHex(a, b, t) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** The most saturated mid-tone in the image, pushed to a usable accent. Resolves to a hex string. */
export function accentFrom(url) {
  return new Promise((res) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 48, 48);
      const d = g.getImageData(0, 0, 48, 48).data; const bins = new Map();
      for (let i = 0; i < d.length; i += 4) { const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); const e = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 }; e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]; bins.set(k, e); }
      const cols = [...bins.values()].map((e) => { const r = e.r / e.n, gg = e.g / e.n, b = e.b / e.n; const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); return { r, g: gg, b, n: e.n, sat: mx ? (mx - mn) / mx : 0, lum: (r * .299 + gg * .587 + b * .114) / 255 }; }).sort((a, b) => b.n - a.n);
      const pick = cols.slice(0, 60).map((c) => ({ c, score: Math.pow(c.sat, 1.6) * Math.sqrt(c.n) * (c.lum > .15 && c.lum < .85 ? 1 : .25) })).sort((a, b) => b.score - a.score)[0].c;
      const toHsl = ({ r, g, b }) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? ((g - b) / dd + (g < b ? 6 : 0)) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; } return [h, s, l]; };
      const fromHsl = (h, s, l) => { const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return { r: f(p, q, h + 1 / 3) * 255, g: f(p, q, h) * 255, b: f(p, q, h - 1 / 3) * 255 }; };
      const [h, s, l] = toHsl(pick);
      const v = s < .12 ? { r: 43, g: 92, b: 255 } : fromHsl(h, Math.max(.5, s), Math.min(.58, Math.max(.42, l)));
      res('#' + [v.r, v.g, v.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''));
    };
    img.onerror = () => res('#2b5cff');
    img.src = url;
  });
}

/**
 * @param {object} el  { now, art, track, artist, bar } footer elements
 * @param {string} base  origin that serves /api/now and /api/art; empty for same-origin
 * @param {(t: { playing: boolean, art: string|null, accent?: string|null, track?: string, artist?: string, bpm?: number|null, energy?: number|null }) => void} [onTrack]  called when playback starts, changes track, or stops; again when a tempo becomes known
 */
export function startNowPlaying(el, base = '', onTrack) {
  const endpoint = base + '/api/now';
  const root = document.documentElement;
  let state = { id: null, playing: false, pos: 0, dur: 1, at: 0 };
  let dead = false, lastAccent = null;
  addEventListener('themechange', () => { root.style.setProperty('--tint', lastAccent && state.playing ? mixHex(paper(), lastAccent, tintAmount()) : paper()); });

  const apply = async (t) => {
    if (!t || !t.playing) {
      if (state.playing) { state.playing = false; el.now.classList.remove('on'); root.style.setProperty('--tint', paper()); lastAccent = null; if (onTrack) onTrack({ playing: false, art: null }); }
      return;
    }
    const changed = t.id !== state.id;
    state = { id: t.id, playing: true, pos: t.progress_ms || 0, dur: t.duration_ms || 1, at: performance.now() };
    if (changed) {
      const art = t.art ? `${base}/api/art?u=${encodeURIComponent(t.art)}` : '';
      el.art.src = art; el.track.textContent = t.track; el.artist.textContent = t.artist; el.now.href = t.url || '#';
      el.now.classList.add('on');
      const accent = art ? await accentFrom(art) : null;
      lastAccent = accent; if (accent) root.style.setProperty('--tint', mixHex(paper(), accent, tintAmount()));
      const info = { playing: true, art: art || null, accent, track: t.track, artist: t.artist, bpm: t.bpm || null, energy: t.energy ?? null };
      if (onTrack) onTrack(info);
      if (!info.bpm && t.preview && onTrack) { const id = t.id; estimateTempo(base + t.preview).then((e) => { if (e && state.id === id && state.playing) onTrack({ ...info, bpm: e.bpm, energy: e.energy }); }); }
    }
  };

  const poll = async () => {
    if (dead) return;
    try {
      const r = await fetch(endpoint, { cache: 'no-store' });
      if (r.status === 404) { dead = true; return; } // no function behind this page; stay paper
      if (r.ok) apply(await r.json());
    } catch { /* offline or blocked: keep the last state */ }
  };

  const tick = () => {
    if (state.playing) { const pos = Math.min(state.dur, state.pos + (performance.now() - state.at)); el.bar.style.width = (pos / state.dur * 100) + '%'; }
    requestAnimationFrame(tick);
  };

  poll(); tick();
  const timer = setInterval(() => { if (!document.hidden) poll(); }, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  return () => { dead = true; clearInterval(timer); };
}
