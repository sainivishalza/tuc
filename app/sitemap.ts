import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";

// TODO: replace with the real domain once this site is deployed.
const BASE_URL = "https://theuniquechoice.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: new Date(),
  }));
}
