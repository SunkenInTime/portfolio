# me.daracloud.uk — portfolio

Astro site. Paper and Geist, light or dark (follows the system, with a footer toggle). The home is a soft-focus avatar (a WebGL
variable-blur pass over the photo), a sparse flock of ink dashes, and a now-playing
line fed by Spotify through a Cloudflare Pages Function; the album art becomes a ring
around the avatar and tints the page. Inner pages are a 720px reader on the same paper, with a section marker in the left margin.
URLs match the old Hugo site exactly; the privacy/legal pages are linked from app store
listings and must keep their paths.

## Commands

| Command           | Action                              |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Dev server at `localhost:4321`      |
| `npm run build`   | Static build to `./dist/`           |
| `npm run preview` | Serve the built site locally        |

## Where things live

- `src/content/projects/` — one markdown file per project
- `src/content/articles/` — devlog articles (same `/articles/*` URLs as the old site)
- `src/content/legal/` — privacy policies / ToS / support pages, served at `/privacy-policies/<slug>` (do not rename these files)
- `src/pages/index.astro` + `src/layouts/Home.astro` + `src/styles/home.css` — the home
- `src/layouts/Site.astro` + `src/styles/site.css` — every other page (lists, reader, contact, 404, legal)
- `src/styles/tokens.css` — colours, fonts, the footer and the underline, shared by both
- `src/lib/soft.js` — the variable-blur pipeline (home avatar, album ring); `ring.js`, `flock.js`, `now.js`, `tempo.js` — the home's moving parts; `theme.js` (light/dark), `toc.js` (section marker)
- `functions/api/` — Cloudflare Pages Functions: `now.js` (Spotify now-playing + tempo sources), `art.js` and `preview.js` (same-origin proxies)
- `public/images/` — images, same `/images/...` paths as the old site
- `dev/` — the local Spotify bridge (`node dev/serve.mjs`, port 4399) and a server for the built site (`node dev/serve-dist.mjs`, port 4400); not deployed

## Spotify

Production needs three secrets on the Pages project: `SPOTIFY_CLIENT_ID`,
`SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` (scope `user-read-currently-playing`; the
refresh token comes from the one-time OAuth run in `dev/serve.mjs` at `/auth`). Without
them the site is paper and shows no track. In dev, `.env` can set `PUBLIC_API_BASE` to the
bridge's origin so the page reads the local bridge instead of `/api`.
