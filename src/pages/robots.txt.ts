/**
 * robots.txt — generated rather than served from public/.
 *
 * The `Sitemap:` line must be an absolute URL on the same host as the sitemap that
 * @astrojs/sitemap emits — crawlers discard a cross-host one. A static public/robots.txt
 * would duplicate the origin by hand and drift the next time `site` in astro.config.mjs
 * changes. Deriving both from the same `site` value makes that divergence impossible.
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
