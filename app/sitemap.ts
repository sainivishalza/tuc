import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";

const BASE_URL = "https://theuniquechoice.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: new Date(),
  }));
}
