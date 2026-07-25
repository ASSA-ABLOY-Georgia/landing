// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Canonical origin. Feeds canonical tags, the sitemap's absolute URLs, and the
  // Web3Forms `redirect` field in ContactForm.astro — so a hardcoded placeholder would
  // bounce form submissions from a *.netlify.app deploy to a domain that does not
  // resolve yet.
  //
  // ⚠ The CONTEXT gate is load-bearing. DEPLOY_PRIME_URL is set on *every* Netlify
  // deploy including production, where it is the deploy host (`main--site.netlify.app`),
  // NOT the custom domain — trusting it there would self-canonicalise the live site onto
  // netlify.app and send form submissions there too. Only URL is documented as "the main
  // address to your site … or your own custom domain". Locally all three are unset and we
  // fall through to the placeholder.
  site:
    (process.env.CONTEXT === "production" ? process.env.URL : process.env.DEPLOY_PRIME_URL) ||
    process.env.URL ||
    "https://assa-abloy.ge",

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
