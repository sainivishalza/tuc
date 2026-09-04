import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import enDict from "@/lib/dictionaries/en.json";

const BASE_URL = "https://theuniquechoice.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/about", "/contact", "/blog"];
  const blogPostPaths = enDict.blog.posts.map((post) => `/blog/${post.slug}`);

  return locales.flatMap((locale) =>
    [...staticPaths, ...blogPostPaths].map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
    }))
  );
}
