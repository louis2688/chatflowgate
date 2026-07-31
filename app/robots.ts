import type { MetadataRoute } from "next";

// Was missing entirely, which mattered little on the old domain but matters now:
// a brand new host has no crawl history, so the sitemap pointer is the fastest
// way for a crawler to find every page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing behind auth or per-visitor is worth crawling, and the widget
        // routes would otherwise be indexed as thin duplicate pages.
        disallow: ["/api/", "/widget/", "/preview/", "/bots", "/billing", "/sessions", "/settings", "/security", "/dashboard", "/analytics"],
      },
    ],
    sitemap: "https://www.chatflowgate.com/sitemap.xml",
    host: "https://www.chatflowgate.com",
  };
}