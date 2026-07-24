// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Placeholder domain until the client provides one (PLAN §7, §9).
  site: "https://assaabloy.ge",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
