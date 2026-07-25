// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Placeholder domain until the client provides one (PLAN §7, §9).
  site: "https://assaabloy.ge",

  // Single family: Noto Sans Georgian (variable 400–800), georgian + latin subsets,
  // via the Astro Fonts API + Fontsource provider (PLAN §3). Exposed as --font-georgian,
  // consumed by --font-sans in src/styles/global.css.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans Georgian",
      cssVariable: "--font-georgian",
      weights: ["400 800"],
      subsets: ["georgian", "latin"],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    // /contact/thanks is noindex (PLAN §7) — listing it in the sitemap would send
    // crawlers contradictory signals. /styleguide is also noindex but is deleted
    // in Phase 6, where sitemap correctness is an exit criterion.
    sitemap({ filter: (page) => !page.endsWith("/contact/thanks/") }),
  ],
});
