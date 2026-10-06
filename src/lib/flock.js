/*
  The flock: a sparse flock of ink dashes drifting across the page (boids), pushed away by the pointer
  and steering around the content block. The one thing on the page that is alive when nothing is playing.
  Ported from the design mock: dpr-aware, frame-rate independent, pauses when hidden.
*/

const mixRgba = (rgba, hex, t) => { const m = rgba.match(/[\d.]+/g).map(Number); const h = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${m.slice(0, 3).map((v, i) => Math.round(v + (h[i] - v) * t)).join(',')},${Math.min(1, (m[3] ?? 1) + .15)})`; };

const DEFAULTS = { n: 60, size: 7, min: .8, max: 2.2, see: 90, sep: 28, align: .03, coh: .0008, sepW: .02, pr: 140, pf: .5, color: 'rgba(22,22,22,.35)', width: 1.5, margin: 64 };

/**
 * @param {HTMLCanvasElement} canvas  full-viewport canvas behind the content
 * @param {HTMLElement|HTMLElement[]} avoid  the content block(s) the flock steers around
 */
export function startFlock(canvas, avoid, opts = {}) {
  const avoids = Array.isArray(avoid) ? avoid : [avoid];
  const o = Object.assign({}, DEFAULTS, opts);
  const inkRgba = () => { const h = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(); if (!/^#[0-9a-f]{6}$/i.test(h)) return DEFAULTS.color; return `rgba(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')},.35)`; };
  o.color = inkRgba();
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  const B = []; let W = 0, H = 0, dpr = 1;
  const music = { playing: false, bpm: 0, energy: .3, color: o.color, t0: 0, pulse: 0, accent: null }; // pulse: 1 on a beat, decays
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr); };
  const spawn = () => { const want = Math.round(o.n * Math.min(1.4, Math.max(.5, (W * H) / (1280 * 800)))); while (B.length < want) B.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2 }); while (B.length > want) B.pop(); };
  let mx = -9999, my = -9999;
  const onMove = (e) => { mx = e.clientX; my = e.clientY; }; const onLeave = () => { mx = my = -9999; };
  addEventListener('resize', resize); addEventListener('pointermove', onMove); document.addEventListener('pointerleave', onLeave);
  resize(); spawn();

  let raf = 0, running = true, last = performance.now();
  const frame = (now) => {
    if (!running) return;
    const k = Math.min(2, (now - last) / 16.67); last = now; // steps per 60fps frame
    spawn();
    const zones = avoids.map((el) => { const r = el.getBoundingClientRect(); return { bx: r.left + r.width / 2, by: r.top + r.height / 2, brx: r.width / 2 + o.margin, bry: r.height / 2 + o.margin }; });
    // music: energy sets the pace and how tightly they school; each beat is a kick that decays
    const e = music.playing ? music.energy : 0;
    if (music.playing && music.bpm) { const per = 60000 / music.bpm; const ph = ((now - music.t0) % per) / per; if (ph < music.lastPh) music.pulse = 1; music.lastPh = ph; }
    music.pulse *= Math.pow(.86, k);
    const pace = 1 + e * .9 + music.pulse * .8 * e;
    const max = o.max * pace, min = o.min * (1 + e * .5);
    const coh = o.coh * (1 + e * 2.5), align = o.align * (1 + e * 1.5);
    for (const b of B) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
      for (const q of B) { if (q === b) continue; const dx = q.x - b.x, dy = q.y - b.y, d2 = dx * dx + dy * dy; if (d2 < o.see * o.see) { n++; ax += q.vx; ay += q.vy; cx += q.x; cy += q.y; if (d2 < o.sep * o.sep) { sx -= dx; sy -= dy; } } }
      if (n) { b.vx += ((ax / n - b.vx) * align + (cx / n - b.x) * coh + sx * o.sepW) * k; b.vy += ((ay / n - b.vy) * align + (cy / n - b.y) * coh + sy * o.sepW) * k; }
      const dxm = b.x - mx, dym = b.y - my, dm = Math.hypot(dxm, dym) || 1; if (dm < o.pr) { b.vx += dxm / dm * o.pf * k; b.vy += dym / dm * o.pf * k; }
      for (const z of zones) { const ex = (b.x - z.bx) / z.brx, ey = (b.y - z.by) / z.bry; const e2 = ex * ex + ey * ey; if (e2 < 1.3) { const f = (1.3 - e2) * .35 * k; b.vx += ex * f; b.vy += ey * f; } }
      const sp = Math.hypot(b.vx, b.vy) || 1; if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; } if (sp < min) { b.vx *= min / sp; b.vy *= min / sp; }
      b.x += b.vx * k; b.y += b.vy * k; const m = 12; if (b.x < -m) b.x = W + m; if (b.x > W + m) b.x = -m; if (b.y < -m) b.y = H + m; if (b.y > H + m) b.y = -m;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.strokeStyle = music.color; ctx.lineWidth = o.width + music.pulse * .8; ctx.lineCap = 'round';
    const L = o.size * (1 + music.pulse * .6 * e);
    for (const b of B) { const s = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / s, uy = b.vy / s; ctx.beginPath(); ctx.moveTo(b.x - ux * L, b.y - uy * L); ctx.lineTo(b.x + ux * L, b.y + uy * L); ctx.stroke(); }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', onVis);

  return {
    /** @param {{ playing: boolean, bpm?: number|null, energy?: number|null, accent?: string|null }} m */
    setMusic(m) {
      const was = music.bpm; music.playing = !!m.playing; music.bpm = (m.playing && m.bpm) || 0; music.energy = m.playing ? (m.energy ?? .5) : .3;
      if (music.bpm !== was) { music.t0 = performance.now(); music.lastPh = 0; }
      music.accent = m.playing ? (m.accent || null) : null; music.color = m.playing && m.accent ? mixRgba(o.color, m.accent, .55) : o.color;
    },
    retheme() { o.color = inkRgba(); music.color = music.playing && music.accent ? mixRgba(o.color, music.accent, .55) : o.color; },
    destroy() { running = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', onVis); },
  };
}
