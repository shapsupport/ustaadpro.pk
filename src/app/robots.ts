import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ustaadpro.pk").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/shop-checkout", "/service-checkout"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
