# me.daracloud.uk — portfolio

Astro rebuild of the old Hugo portfolio, keeping the original look: this is a
faithful port of the charlolamode (PaperMod fork) theme — profile-mode home,
card lists, light/dark toggle — on top of Astro content collections. URLs match
the old site exactly; the privacy/legal pages are linked from app store
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
- `src/pages/` — routes; `src/layouts/Base.astro` is the shared shell (head, nav, theme toggle, footer)
- `src/styles/global.css` — the original theme CSS, carried over verbatim from the Hugo theme
- `public/images/` — images carried over from the old site, same `/images/...` paths

## Restyling (for the future redesign)

The look is the old Hugo theme's CSS, concatenated into `src/styles/global.css`.
Colors and layout constants live in the `:root` and `.dark` blocks near the top
of that file (from the theme's `theme-vars.css`). The light/dark toggle works by
putting a `dark` class on `<body>` (persisted in `localStorage` under
`pref-theme`), so any future theme needs both blocks. Fonts are the system
stack, set on `body` in the reset section.

When a full redesign happens, `global.css` can be replaced wholesale — the page
markup is semantic PaperMod-style classes (`post-entry`, `post-single`,
`profile`, etc.) all defined in that one file.
