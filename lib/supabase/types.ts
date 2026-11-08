export type FontChoice = "inter" | "poppins" | "playfair" | "publicsans";
export type TextScale = "small" | "medium" | "large";
export type CornerStyle = "sharp" | "rounded" | "soft";

export interface SiteTheme {
  id: string;
  primary_color: string;
  accent_color: string;
  secondary_color: string;
  surface_color: string;
  background_color: string;
  text_color: string;
  muted_color: string;
  font_choice: FontChoice;
  text_scale: TextScale;
  corner_style: CornerStyle;
  tinted_sections: boolean;
  logo_url: string | null;
  updated_at: string;
}

export interface QuoteLineItem {
  product: string;
  quantity: string;
  notes: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  product: string | null;
  quantity: string | null;
  timeline: string | null;
  message: string | null;
  items: QuoteLineItem[] | null;
  status: "new" | "contacted" | "closed" | "lost";
  /** Staff-entered deal value once a quote is priced — null until then, never derived or estimated. */
  quoted_value: number | null;
  created_at: string;
  /** Set once the automated "still with us?" follow-up email has gone
   * out (lib/followUp.ts) — never null→set twice, so a customer who's
   * already been reminded doesn't get a second nudge every day it stays
   * "new". */
  followup_sent_at: string | null;
}

/** A live aggregation over quote_requests grouped by email — see the
 * admin_clients view. Not a stored table: there is no persistent client
 * record independent of quote history. */
export interface AdminClient {
  email: string;
  name: string;
  whatsapp: string | null;
  quote_count: number;
  total_won_value: number | null;
  last_quote_at: string;
  has_open_quote: boolean;
}

export interface ClientNote {
  email: string;
  notes: string;
  updated_at: string;
}

/** A registered client-portal account — separate from AdminClient (a live
 * aggregation over quote history). This is the actual account record: it's
 * what requestPortalLink checks to decide whether to send a sign-in link
 * or tell the visitor to register first. */
export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  created_at: string;
}

export interface SourcingCategory {
  id: string;
  name: string;
  created_at: string;
}

export type SourcingRequestType = "product" | "service" | "other";
export type SourcingRequestStatus = "pending" | "approved" | "rejected" | "closed";
export type SourcingRequestSource = "direct" | "promoted_from_quote";
export type TranslationStatus = "pending" | "done" | "failed" | "skipped";

export interface SourcingRequest {
  id: string;
  title: string;
  description: string;
  type: SourcingRequestType;
  category_id: string | null;
  quantity: string | null;
  budget_range: string | null;
  timeline: string | null;
  destination_country: string | null;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string | null;
  image_urls: string[];
  video_url: string | null;
  social_link: string | null;
  title_zh: string | null;
  description_zh: string | null;
  title_ru: string | null;
  description_ru: string | null;
  translation_status: TranslationStatus;
  status: SourcingRequestStatus;
  source: SourcingRequestSource;
  quote_request_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  /** Set once the automated "no interest yet?" follow-up email has gone
   * out (lib/followUp.ts) — same never-twice guard as QuoteRequest's. */
  followup_sent_at: string | null;
}

/** What the public board/detail page and the submit form may ever see —
 * deliberately excludes customer_name/email/whatsapp. A query that selects
 * this shape can never leak contact info no matter what UI code does with it. */
export type PublicSourcingRequest = Omit<
  SourcingRequest,
  "customer_name" | "customer_email" | "customer_whatsapp"
> & { category_name: string | null };

/** Full admin view, with the category name joined in and engagement counts. */
export interface AdminSourcingRequest extends SourcingRequest {
  category_name: string | null;
  interest_count: number;
  push_count: number;
}

/** What an approved, signed-in supplier sees on their own board — full
 * contact fields, plus whether they've already clicked "I'm interested". */
export interface SupplierVisibleSourcingRequest extends PublicSourcingRequest {
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string | null;
  already_interested: boolean;
}

export interface SourcingRequestInterest {
  id: string;
  sourcing_request_id: string;
  supplier_id: string;
  /** Staff-entered after the fact — the platform never sees the actual
   * conversation (contact is revealed directly to the supplier), so
   * this is the only way a completed deal gets recorded at all. "won"
   * is what a supplier's public deal-count stat is built from. */
  deal_status: "pending" | "won" | "lost";
  created_at: string;
}

export type ConnectMode = "direct" | "staff_mediated" | "platform_chat";
export type MonetizationMode = "free" | "supplier_paid" | "commission";

export type AiProvider = "env" | "anthropic" | "openai_compatible";

/** Raw DB row shape — includes the real ai_api_key, so this never leaves
 * the server. getPlatformSettings() (lib/actions/sourcingRequests.ts)
 * returns the client-safe PlatformSettingsView below instead. */
export interface PlatformSettings {
  id: string;
  connect_mode: ConnectMode;
  monetization_mode: MonetizationMode;
  ai_provider: AiProvider;
  ai_api_key: string | null;
  ai_model: string | null;
  ai_base_url: string | null;
  updated_at: string;
}

/** What the admin settings card actually receives — the key itself is
 * masked server-side (see getPlatformSettings) so it's never embedded in
 * client-rendered HTML. */
export interface PlatformSettingsView {
  id: string;
  connect_mode: ConnectMode;
  monetization_mode: MonetizationMode;
  ai_provider: AiProvider;
  ai_key_preview: string | null;
  ai_model: string | null;
  ai_base_url: string | null;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  quote: string;
  rating: number;
  locale: string;
  status: "pending" | "approved" | "rejected";
  /** ISO 3166-1 alpha-2 code (e.g. "IN", "US") — staff-entered, never
   * guessed from the client's name. Null until set. */
  country_code: string | null;
  /** Public URL in the site-assets bucket, set only once staff upload a
   * real logo — never a placeholder or generated mark. */
  logo_url: string | null;
  created_at: string;
}

export type BlogBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "related"; heading: string; items: { title: string; href: string }[] }
  | { type: "image"; url: string; alt: string; caption?: string };

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

export interface CaseStudyResult {
  label: string;
  value: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  locale: string;
  client_name: string;
  industry: string;
  title: string;
  summary: string;
  challenge: string;
  solution: string;
  results: CaseStudyResult[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: "newsletter" | "announcement" | "promotional" | "invite" | "general";
  subject: string;
  preheader: string | null;
  headline: string;
  /** Paragraphs, separated by a blank line — rendered into the email shell by lib/emailTemplateRenderer.ts. */
  body_text: string;
  cta_text: string | null;
  cta_url: string | null;
  status: "draft" | "active";
  created_at: string;
  updated_at: string;
}

export interface EmailCampaignSegments {
  clients?: boolean;
  suppliers?: boolean;
  newsletter?: boolean;
  prospects?: boolean;
}

/** A manually-managed outreach list — people who are neither a client nor
 * a supplier yet, added one at a time or via bulk import, to invite them
 * to become one. Kept as its own table (not folded into newsletter
 * subscribers) since these people never opted in the way a newsletter
 * signup or account registration implies — it's a cold-outreach list the
 * admin builds deliberately, not something the site itself grows. */
export interface EmailProspect {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  template_id: string | null;
  name: string;
  segments: EmailCampaignSegments;
  status: "draft" | "scheduled" | "sending" | "paused" | "completed";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  /** When set, the cron-driven send-scheduled-campaigns route drives this
   * campaign to completion on its own once this time passes — an admin
   * never needs to click "send next batch" for it. Null means the
   * campaign only sends when an admin clicks that button. */
  scheduled_at: string | null;
}

export interface EmailCampaignRecipient {
  id: string;
  campaign_id: string;
  email: string;
  /** Captured from the source table (clients.name, suppliers.contact_name,
   * etc.) at campaign-creation time — frozen like the email address, so a
   * later name change doesn't retroactively alter an in-flight send. Null
   * for sources with no name field (newsletter subscribers), in which
   * case merge tags fall back to a generic greeting. */
  name: string | null;
  /** "bounced"/"complained" arrive later, from a Resend webhook — the
   * send itself already succeeded (status was "sent") when Resend
   * reports the recipient's mail server rejected it or marked it spam. */
  status: "pending" | "sent" | "failed" | "skipped_unsubscribed" | "bounced" | "complained";
  error: string | null;
  sent_at: string | null;
  /** Set by the email.delivered webhook — real confirmation from the
   * recipient's mail server, not just "Resend accepted the API call". */
  delivered_at: string | null;
  /** Resend's id for this specific send — how an inbound webhook event
   * (which reports `email_id`) gets matched back to this row. */
  resend_email_id: string | null;
  created_at: string;
}

/** Singleton row (id='default') — the sending circuit breaker's live
 * config and state. paused_until/pause_reason are set automatically when
 * a batch's failure rate crosses failure_pause_threshold_pct (checked at
 * send time) or too many spam complaints land within 24h (checked as
 * webhook events arrive), or manually by an admin — either way,
 * sendNextBatch refuses to send while paused_until is in the future. */
export interface EmailSendSettings {
  id: string;
  max_per_hour: number;
  max_per_batch: number;
  failure_pause_threshold_pct: number;
  /** Spam complaints in a rolling 24h window that trigger an auto-pause —
   * kept far lower than the batch failure threshold, since even a
   * handful of complaints is a serious reputation signal Gmail/Yahoo act
   * on directly, unlike an API-level send failure. */
  max_complaints_before_pause: number;
  paused_until: string | null;
  pause_reason: string | null;
  updated_at: string;
}

export interface EmailEvent {
  id: string;
  /** Resend's webhook event type, e.g. "email.delivered", "email.bounced". */
  type: string;
  resend_email_id: string | null;
  recipient_email: string | null;
  campaign_recipient_id: string | null;
  bounce_type: string | null;
  bounce_subtype: string | null;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: "newsletter" | "guide_download";
  locale: string;
  created_at: string;
}

export interface ShippingRoute {
  id: string;
  slug: string;
  locale: string;
  destination_name: string;
  tagline: string;
  intro: string;
  sea_transit: string;
  air_transit: string;
  express_transit: string;
  highlights: string[];
  faq: BlogFaqItem[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  product_categories: string | null;
  business_address: string | null;
  country: string | null;
  /** 1-5, staff-entered after working with the supplier — null until rated. */
  rating: number | null;
  notes: string | null;
  business_license_url: string | null;
  visiting_card_url: string | null;
  company_photo_url: string | null;
  admin_notes: string | null;
  status: "pending" | "approved" | "rejected";
  /** Short public pitch shown on the supplier's directory profile — distinct
   * from `notes` (private, shown only to admin in the edit form). */
  bio: string | null;
  /** Public photo gallery, capped at MAX_GALLERY_IMAGES (lib/supplierFileUpload.ts). */
  gallery_urls: string[];
  /** Admin-set trust tier, shown as a badge on the directory/profile —
   * deliberately a manual judgment call rather than an auto-computed
   * score (years listed, deal count, review average), since there isn't
   * yet enough real transaction/review history for a formula to mean
   * anything. Revisit as an automatic rule once that data exists. */
  tier: "standard" | "gold" | "premium";
  created_at: string;
  updated_at: string;
}

export interface PriceTier {
  min_qty: number;
  price: number;
}

export type SupplierProductStatus = "active" | "inactive";

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  image_urls: string[];
  /** Alibaba-style quantity-break pricing, sorted ascending by min_qty — not a flat min/max. */
  price_tiers: PriceTier[];
  price_unit: string | null;
  moq: string | null;
  lead_time: string | null;
  unit: string | null;
  customizable: boolean;
  customization_notes: string | null;
  sample_available: boolean;
  sample_price: number | null;
  port_of_shipment: string | null;
  /** A visibility toggle the supplier/admin controls directly — not an
   * approval queue. Products go live immediately on save; there is no
   * moderation gate on this table (deliberately decided against, unlike
   * suppliers/sourcing_requests). */
  status: SupplierProductStatus;
  created_at: string;
  updated_at: string;
}

/** What the public catalog grid/detail and a supplier's own public profile
 * page may ever see — joined with category name and the owning supplier's
 * public-facing identity, and restricted server-side to active products of
 * approved suppliers only (see getPublicProducts/getPublicProductById/
 * getProductsBySupplier in lib/actions/supplierProducts.ts). */
export interface PublicSupplierProduct extends SupplierProduct {
  category_name: string | null;
  supplier_company_name: string;
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
  /** Free-text tag for a linked live-tracking API — only "dhl" is wired up so far. Null = manual entry only. */
  api_provider: string | null;
  created_at: string;
  updated_at: string;
}

export type ShipmentStatus =
  | "not_found"
  | "not_shipped"
  | "in_production"
  | "quality_check"
  | "ready_to_ship"
  | "in_transit"
  | "arrived"
  | "customs_clearance"
  | "customs_inspection"
  | "delayed"
  | "delivered"
  | "exception";

export interface Shipment {
  id: string;
  tracking_number: string;
  carrier_id: string | null;
  customer_name: string | null;
  customer_reference: string | null;
  /** Admin-only — used to send status/update notifications, never shown on the public tracking page. */
  customer_email: string | null;
  /** Admin-only — the carrier's own reference/waybill number, never shown to customers. */
  carrier_reference_no: string | null;
  /** Admin-only — never shown to customers. */
  recipient_postal_code: string | null;
  destination_country: string | null;
  total_pieces: number | null;
  current_location: string | null;
  status: ShipmentStatus;
  /** Free-text detail an admin can attach to the current status — most
   * useful on "delayed"/"exception", where a plain badge doesn't say what
   * actually happened. Shown alongside the status wherever it appears,
   * including the public tracking page. */
  status_note: string | null;
  /** Pre-shipment production stages — shown to the customer as an earlier tracker on the same page. */
  milestone_deposit_paid_at: string | null;
  milestone_sample_approved_at: string | null;
  milestone_production_started_at: string | null;
  milestone_qc_passed_at: string | null;
  milestone_ready_to_ship_at: string | null;
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
  /** Last time this shipment's status/events were pulled from the carrier's API (null if never synced or manually tracked). */
  last_api_sync_at: string | null;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

/** Public-safe projection — never carries customer_name/customer_reference/carrier_reference_no/recipient_postal_code. */
export interface PublicShipment {
  id: string;
  tracking_number: string;
  carrier_name: string | null;
  /** The carrier's api_provider tag (e.g. "dhl"), or null for manually-tracked carriers. */
  carrier_api_provider: string | null;
  last_api_sync_at: string | null;
  destination_country: string | null;
  total_pieces: number | null;
  current_location: string | null;
  status: ShipmentStatus;
  status_note: string | null;
  milestone_deposit_paid_at: string | null;
  milestone_sample_approved_at: string | null;
  milestone_production_started_at: string | null;
  milestone_qc_passed_at: string | null;
  milestone_ready_to_ship_at: string | null;
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

/** A visitor clicking "inquire" on a product or supplier — tracked
 * separately from AnalyticsEvent's generic cta_click (which only counts
 * a static label, never a specific entity) so the admin can see exactly
 * which products/suppliers are actually generating interest. */
export interface Inquiry {
  id: string;
  entity_type: "product" | "supplier";
  entity_id: string;
  supplier_id: string;
  /** Snapshot at click time — only set for a product inquiry, so the
   * admin view still shows a readable label even if the product is
   * later deleted or renamed. */
  product_title: string | null;
  supplier_company_name: string;
  channel: string;
  locale: string | null;
  path: string | null;
  session_id: string | null;
  created_at: string;
}

/** A real customer-submitted review of a supplier — distinct from
 * Supplier.rating (a single admin-set score after staff has worked with
 * them) and from Testimonial (a site-wide, not supplier-specific quote
 * curated for the homepage). This is what actually lets a buyer compare
 * suppliers against each other on the catalog/directory. */
export interface SupplierReview {
  id: string;
  supplier_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface AnalyticsEvent {
  id: number;
  event_type: "pageview" | "cta_click";
  path: string;
  locale: string | null;
  cta_id: string | null;
  session_id: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}
