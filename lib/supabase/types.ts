export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  product: string | null;
  quantity: string | null;
  timeline: string | null;
  message: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  quote: string;
  rating: number;
  locale: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export type BlogBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "related"; heading: string; items: { title: string; href: string }[] };

export interface BlogFaqItem {
  q: string;
  a: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  summary: string;
  body: BlogBodyBlock[];
  faq: BlogFaqItem[];
  author_name: string;
  author_title: string;
  author_bio: string;
  read_time: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryPage {
  id: string;
  slug: string;
  locale: string;
  name: string;
  tagline: string;
  intro: string;
  highlights: string[];
  faq: BlogFaqItem[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  locale: string;
  definition: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface Carrier {
  id: string;
  name: string;
  website_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ShipmentStatus =
  | "not_found"
  | "not_shipped"
  | "in_transit"
  | "delayed"
  | "delivered"
  | "exception";

export interface Shipment {
  id: string;
  tracking_number: string;
  carrier_id: string | null;
  customer_name: string | null;
  customer_reference: string | null;
  /** Admin-only — the carrier's own reference/waybill number, never shown to customers. */
  carrier_reference_no: string | null;
  /** Admin-only — never shown to customers. */
  recipient_postal_code: string | null;
  destination_country: string | null;
  total_pieces: number | null;
  current_location: string | null;
  status: ShipmentStatus;
  milestone_received_at: string | null;
  milestone_shipped_at: string | null;
  milestone_departed_at: string | null;
  milestone_arrived_at: string | null;
  milestone_out_for_delivery_at: string | null;
  milestone_delivered_at: string | null;
  packing_list_excel_path: string | null;
  packing_list_pdf_path: string | null;
  /** Signed proof-of-delivery (photo or scanned receipt), uploaded once the parcel is signed for. */
  pod_file_path: string | null;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

/** Public-safe projection — never carries customer_name/customer_reference/carrier_reference_no/recipient_postal_code. */
export interface PublicShipment {
  id: string;
  tracking_number: string;
  carrier_name: string | null;
  destination_country: string | null;
  total_pieces: number | null;
  current_location: string | null;
  status: ShipmentStatus;
  milestone_received_at: string | null;
  milestone_shipped_at: string | null;
  milestone_departed_at: string | null;
  milestone_arrived_at: string | null;
  milestone_out_for_delivery_at: string | null;
  milestone_delivered_at: string | null;
  has_excel: boolean;
  has_pdf: boolean;
  has_pod: boolean;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  event_at: string;
  description: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: number;
  event_type: "pageview" | "cta_click";
  path: string;
  locale: string | null;
  cta_id: string | null;
  session_id: string | null;
  created_at: string;
}
