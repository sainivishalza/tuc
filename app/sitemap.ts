import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getAllPublishedSlugs } from "@/lib/actions/blogPosts";
import { getAllPublishedCategorySlugs } from "@/lib/actions/categoryPages";

const BASE_URL = "https://theuniquechoice.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/about", "/contact", "/blog", "/sourcing"];
  const publishedSlugs = await getAllPublishedSlugs();
  const publishedCategorySlugs = await getAllPublishedCategorySlugs();

  const staticEntries = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
    }))
  );

  const blogEntries = publishedSlugs.map(({ locale, slug }) => ({
    url: `${BASE_URL}/${locale}/blog/${slug}`,
    lastModified: new Date(),
  }));

  const categoryEntries = publishedCategorySlugs.map(({ locale, slug }) => ({
    url: `${BASE_URL}/${locale}/sourcing/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...blogEntries, ...categoryEntries];
}
