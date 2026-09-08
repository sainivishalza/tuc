// Free shipping-document checklist — no external API. Combines the four
// documents every China import needs regardless of product, with the one
// category-specific certification note already vetted in productMatcher's
// category profiles, so the two stay in sync instead of drifting apart.

import type { CategoryProfile } from "./productMatcher";

export interface DocumentItem {
  name: string;
  note: string;
}

export interface CoreDocumentsContent {
  commercialInvoice: DocumentItem;
  packingList: DocumentItem;
  billOfLading: DocumentItem;
  certOfOrigin: DocumentItem;
}

export function getCoreDocuments(content: CoreDocumentsContent): DocumentItem[] {
  return [content.commercialInvoice, content.packingList, content.billOfLading, content.certOfOrigin];
}

export function buildDocumentChecklist(
  categoryId: string,
  categories: CategoryProfile[],
  coreDocuments: DocumentItem[],
  certificationSuffix: string
): DocumentItem[] {
  const profile = categories.find((p) => p.id === categoryId);
  if (!profile) return coreDocuments;

  const categoryDoc: DocumentItem = {
    name: `${profile.label}${certificationSuffix}`,
    note: profile.certs,
  };

  return [...coreDocuments, categoryDoc];
}
