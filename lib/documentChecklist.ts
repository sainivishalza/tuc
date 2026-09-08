// Free shipping-document checklist — no external API. Combines the four
// documents every China import needs regardless of product, with the one
// category-specific certification note already vetted in productMatcher's
// category profiles, so the two stay in sync instead of drifting apart.

import { CATEGORY_PROFILES } from "./productMatcher";

export interface DocumentItem {
  name: string;
  note: string;
}

export const CORE_DOCUMENTS: DocumentItem[] = [
  {
    name: "Commercial Invoice",
    note: "Lists what's being shipped and its declared value — customs uses this to assess duty.",
  },
  {
    name: "Packing List",
    note: "Itemizes what's in each carton — customs and your freight forwarder both need this to match cargo to paperwork.",
  },
  {
    name: "Bill of Lading (sea) or Air Waybill (air)",
    note: "Your proof of shipment, and the document that lets you or your forwarder claim the goods at destination.",
  },
  {
    name: "Certificate of Origin",
    note: "States the goods were manufactured in China — sometimes required for preferential duty rates depending on your country's trade agreements.",
  },
];

export function buildDocumentChecklist(categoryId: string): DocumentItem[] {
  const profile = CATEGORY_PROFILES.find((p) => p.id === categoryId);
  if (!profile) return CORE_DOCUMENTS;

  const categoryDoc: DocumentItem = {
    name: `${profile.label} certification`,
    note: profile.certs,
  };

  return [...CORE_DOCUMENTS, categoryDoc];
}
