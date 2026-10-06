/*
  Theme: light or dark. The system setting wins until the reader picks one; the pick is remembered.
  The <html> element carries data-theme so CSS can switch tokens; a `themechange` event lets the
  canvases (flock, music tint) re-read the colours.
*/
const KEY = 'theme';

export function currentTheme() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }

export function applyTheme(theme, remember) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', theme === 'dark' ? '#151514' : '#f7f7f4');
  if (remember) { try { localStorage.setItem(KEY, theme); } catch { /* private mode */ } }
  dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export function toggleTheme() { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true); }

/** Wires a toggle button: label shows the theme you would switch to. */
export function themeButton(btn) {
  const label = () => { btn.textContent = currentTheme() === 'dark' ? 'light' : 'dark'; };
  btn.addEventListener('click', toggleTheme); addEventListener('themechange', label); label();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { let stored = null; try { stored = localStorage.getItem(KEY); } catch { /* ignore */ } if (!stored) applyTheme(e.matches ? 'dark' : 'light', false); });
}

/** The inline script for <head>: sets data-theme before first paint so there is no flash. */
export const HEAD_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem('${KEY}')}catch(e){}if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#151514':'#f7f7f4');})();`;
