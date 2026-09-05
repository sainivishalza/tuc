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
  | { type: "list"; items: string[] };

export interface BlogPost {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  summary: string;
  body: BlogBodyBlock[];
  author_name: string;
  author_title: string;
  author_bio: string;
  read_time: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
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
