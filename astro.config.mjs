// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Canonical origin. Feeds canonical tags, the sitemap's absolute URLs, robots.txt's
  // `Sitemap:` line, and the Web3Forms `redirect` field in ContactForm.astro.
  //
  // Hardcoded on purpose. Cloudflare Workers Builds exposes no deploy-URL variable, and
  // reading a generic env var (as the Netlify setup did with URL / DEPLOY_PRIME_URL)
  // would let a stray `URL` hijack the canonicals. Preview deploys on *.workers.dev
  // therefore canonicalise to production, which is what we want for SEO; a test
  // submission of the contact form there lands on the live /contact/thanks/.
  site: "https://assa-abloy.ge",

  // Single family: Noto Sans Georgian (variable 400–800), georgian + latin subsets, via
  // the Astro Fonts API + Fontsource provider. Exposed as --font-georgian, consumed by
  // --font-sans in src/styles/global.css.
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
    // /contact/thanks is noindex — listing it in the sitemap would send crawlers
    // contradictory signals. (/404 is excluded by the integration itself.)
    sitemap({ filter: (page) => !page.endsWith("/contact/thanks/") }),
  ],
});
