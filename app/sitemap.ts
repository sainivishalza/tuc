import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getAllPublishedSlugs } from "@/lib/actions/blogPosts";
import { getAllPublishedCategorySlugs } from "@/lib/actions/categoryPages";
import { getAllPublishedCaseStudySlugs } from "@/lib/actions/caseStudies";
import { getAllPublishedRouteSlugs } from "@/lib/actions/shippingRoutes";
import { getAllApprovedSupplierIds } from "@/lib/actions/suppliers";
import { getAllActiveProductIds } from "@/lib/actions/supplierProducts";

const BASE_URL = "https://theuniquechoice.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sourcing Requests gets its board page listed, but not individual
  // requests — those are customer-submitted and ephemeral (often closed
  // within days), unlike products/suppliers, which are evergreen listings
  // worth indexing individually.
  const staticPaths = ["", "/about", "/contact", "/blog", "/sourcing", "/glossary", "/case-studies", "/security", "/bulk-quote", "/guide", "/shipping", "/suppliers", "/suppliers/register", "/products", "/sourcing-requests"];
  const publishedSlugs = await getAllPublishedSlugs();
  const publishedCategorySlugs = await getAllPublishedCategorySlugs();
  const publishedCaseStudySlugs = await getAllPublishedCaseStudySlugs();
  const publishedRouteSlugs = await getAllPublishedRouteSlugs();
  const approvedSupplierIds = await getAllApprovedSupplierIds();
  const activeProductIds = await getAllActiveProductIds();

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

  const routeEntries = publishedRouteSlugs.map(({ locale, slug }) => ({
    url: `${BASE_URL}/${locale}/shipping/${slug}`,
    lastModified: new Date(),
  }));

  // Suppliers/products aren't per-locale rows (unlike blog posts etc.), so
  // each id gets one entry per site locale, same way /suppliers itself
  // does as a static path above.
  const supplierEntries = locales.flatMap((locale) =>
    approvedSupplierIds.map((id) => ({
      url: `${BASE_URL}/${locale}/suppliers/${id}`,
      lastModified: new Date(),
    }))
  );

  const productEntries = locales.flatMap((locale) =>
    activeProductIds.map((id) => ({
      url: `${BASE_URL}/${locale}/products/${id}`,
      lastModified: new Date(),
    }))
  );

  return [
    ...staticEntries,
    ...blogEntries,
    ...categoryEntries,
    ...caseStudyEntries,
    ...routeEntries,
    ...supplierEntries,
    ...productEntries,
  ];
}
