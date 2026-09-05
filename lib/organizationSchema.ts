/**
 * Single source of truth for the business's structured-data identity
 * (NAP + founder + social links). Reused across every page that emits
 * Organization/LocalBusiness JSON-LD so the entity data can never
 * drift out of sync between pages.
 */
export function getOrganizationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Unique Choice",
    description,
    url: "https://theuniquechoice.com",
    email: "hello@theuniquechoice.com",
    telephone: "+91 98967 39100",
    areaServed: ["Hong Kong", "India", "South Africa"],
    sameAs: [
      "https://www.facebook.com/choicetheunique",
      "https://www.instagram.com/choicetheunique",
    ],
    founder: {
      "@type": "Person",
      name: "Vishal Saini",
      jobTitle: "Founder",
    },
  };
}
