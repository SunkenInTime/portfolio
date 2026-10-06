/*
  Section marker for the reader: the article's h2s listed in the margin, with a marker that springs to the
  section being read. The spring has mass, so the marker overshoots a touch and stretches while it travels.
*/

const SPRING = { k: 170, c: 22 }; // stiff enough to settle in ~0.4 s, light enough to overshoot once

export function sectionMarker(aside, prose, opts = {}) {
  const heads = Array.from(prose.querySelectorAll('h2'));
  if (heads.length < 2) { aside.hidden = true; return null; }
  const line = opts.line ?? .35;
  const still = !!opts.reducedMotion;
  heads.forEach((h, i) => { if (!h.id) h.id = 's' + (i + 1); });

  aside.innerHTML = '<div class="toc-bar" aria-hidden="true"></div><ol class="toc-list">' + heads.map((h) => `<li><a href="#${h.id}">${h.textContent}</a></li>`).join('') + '</ol>';
  const bar = aside.querySelector('.toc-bar'); const items = Array.from(aside.querySelectorAll('li'));

  let active = -1, y = 0, v = 0, h = 0, hv = 0, last = performance.now(), raf = 0;
  const target = () => { const r = items[active].getBoundingClientRect(), a = aside.getBoundingClientRect(); return { y: r.top - a.top, h: r.height }; };

  const pick = () => {
    const l = innerHeight * line; let i = 0;
    heads.forEach((hd, k) => { if (hd.getBoundingClientRect().top <= l) i = k; });
    if (i !== active) { active = i; items.forEach((it, k) => it.classList.toggle('on', k === i)); }
  };

  const tick = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = target();
    if (still) { y = t.y; h = t.h; v = 0; }
    else { v += (SPRING.k * (t.y - y) - SPRING.c * v) * dt; y += v * dt; hv += (SPRING.k * (t.h - h) - SPRING.c * hv) * dt; h += hv * dt; }
    // stretch with speed, like something with weight being pulled
    const stretch = Math.min(14, Math.abs(v) * .06);
    bar.style.transform = `translateY(${(y - stretch / 2).toFixed(2)}px)`; bar.style.height = (h + stretch).toFixed(2) + 'px';
    raf = requestAnimationFrame(tick);
  };

  pick(); const t0 = target(); y = t0.y; h = t0.h; raf = requestAnimationFrame(tick);
  addEventListener('scroll', pick, { passive: true }); addEventListener('resize', pick);
  items.forEach((it, i) => it.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); const top = heads[i].getBoundingClientRect().top + scrollY - innerHeight * line + 2; scrollTo({ top, behavior: still ? 'auto' : 'smooth' }); history.replaceState(null, '', '#' + heads[i].id); }));
  return { destroy() { cancelAnimationFrame(raf); removeEventListener('scroll', pick); removeEventListener('resize', pick); } };
}
