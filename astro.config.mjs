// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://me.daracloud.uk',
  // URLs match the old Hugo site exactly (app store listings link the
  // privacy pages directly, and /articles/* keeps its old paths).
});
