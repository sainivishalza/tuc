import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getAllPublishedSlugs } from "@/lib/actions/blogPosts";
import { getAllPublishedCategorySlugs } from "@/lib/actions/categoryPages";
import { getAllPublishedCaseStudySlugs } from "@/lib/actions/caseStudies";

const BASE_URL = "https://theuniquechoice.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/about", "/contact", "/blog", "/sourcing", "/glossary", "/case-studies", "/security", "/bulk-quote"];
  const publishedSlugs = await getAllPublishedSlugs();
  const publishedCategorySlugs = await getAllPublishedCategorySlugs();
  const publishedCaseStudySlugs = await getAllPublishedCaseStudySlugs();

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

  const caseStudyEntries = publishedCaseStudySlugs.map(({ locale, slug }) => ({
    url: `${BASE_URL}/${locale}/case-studies/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...blogEntries, ...categoryEntries, ...caseStudyEntries];
}
