// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://me.daracloud.uk',
  // dev only: lets the tailnet hostname reach `astro dev` for review
  vite: { server: { allowedHosts: ['dara-pc-duo.tailba589e.ts.net'] } },
  // URLs match the old Hugo site exactly (app store listings link the
  // privacy pages directly, and /articles/* keeps its old paths).
});
