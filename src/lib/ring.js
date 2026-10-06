/*
  The album ring: what Dara is listening to, shown as a thin halo of the album art around the avatar.
  Drawn in 2D, then run through the same Soft pipeline as the avatar so it shares the grain and the melt.
  Grows in when a track starts, turns slowly, shrinks away when nothing plays.
*/
import { Soft } from './soft.js';

const S = 720;          // source canvas size; the avatar circle is 62% of the canvas, radius 223 here
const INNER = 232;      // just outside the avatar's edge
const WIDTH = 40;       // ring thickness at full size

export function albumRing(canvas, opts = {}) {
  const still = !!opts.reducedMotion;
  const src = document.createElement('canvas'); src.width = src.height = S; const g = src.getContext('2d');
  const st = { art: null, playing: false, show: 0, angle: 0, accent: null };
  let tex = null, last = performance.now(), raf = 0, running = true;
  const paper = () => { const t = getComputedStyle(document.documentElement).getPropertyValue('--tint').trim() || '#f7f7f4'; return [1, 3, 5].map((i) => parseInt(t.slice(i, i + 2), 16) / 255); };

  const draw = () => {
    g.clearRect(0, 0, S, S); if (st.show < .01) return;
    const ro = INNER + WIDTH * st.show;
    g.save(); g.translate(S / 2, S / 2); g.rotate(st.angle);
    g.beginPath(); g.arc(0, 0, ro, 0, Math.PI * 2); g.arc(0, 0, INNER, 0, Math.PI * 2, true); g.clip('evenodd');
    if (st.art) g.drawImage(st.art, -ro, -ro, ro * 2, ro * 2); else { g.fillStyle = '#c9c9c4'; g.fillRect(-ro, -ro, ro * 2, ro * 2); }
    // pale covers vanish into the paper: multiply the ring with the album's accent so it always has presence
    if (st.accent) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = .45; g.fillStyle = st.accent; g.fillRect(-ro, -ro, ro * 2, ro * 2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    g.restore();
  };

  const soft = Soft(canvas, {
    source: `uniform sampler2D uTex; uniform vec3 uBg; void main(){ vec4 c = texture2D(uTex, vUv); gl_FragColor = vec4(mix(uBg, c.rgb, c.a), c.a); }`,
    onSource: (u, gl) => {
      if (!tex) { tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.uniform1i(u.uTex, 5); const b = paper(); gl.uniform3f(u.uBg, b[0], b[1], b[2]);
    },
  });
  if (!soft) return null;

  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!still) st.angle += (Math.PI * 2 / 60) * dt * .25; // one turn every four minutes
    st.show += ((st.playing ? 1 : 0) - st.show) * .05;
    draw(); raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); } };
  document.addEventListener('visibilitychange', onVis);

  return {
    /** @param {{ playing: boolean, art?: string|null, accent?: string|null }} t  art is a same-origin or CORS-enabled image URL; accent a hex colour */
    setTrack(t) {
      st.playing = !!(t && t.playing); st.accent = (t && t.accent) || null;
      if (t && t.art && t.art !== st.artUrl) { st.artUrl = t.art; const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => { if (st.artUrl === t.art) st.art = img; }; img.src = t.art; }
      if (!st.playing) st.artUrl = null;
    },
    destroy() { running = false; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); soft.destroy(); },
  };
}
