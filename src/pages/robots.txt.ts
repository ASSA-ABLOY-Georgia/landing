/**
 * robots.txt — generated rather than served from public/.
 *
 * The `Sitemap:` line must be an absolute URL, and `site` in astro.config.mjs is now
 * environment-dependent on Netlify. A static public/robots.txt would therefore drift:
 * it would advertise a sitemap on a *different host* than the one @astrojs/sitemap
 * actually emits, which crawlers discard as cross-host. Deriving both from the same
 * `site` value makes that divergence impossible.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  // Leading slash: origin-relative, so this is correct whether or not `site` carries
  // a trailing slash.
  const sitemapURL = new URL("/sitemap-index.xml", site);

  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
