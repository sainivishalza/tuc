export interface AdminFeature {
  title: string;
  description: string;
  href: string;
  status: "live" | "planned";
}

/**
 * Registry of admin-panel links. Add an entry here whenever a new
 * feature needs a place in /admin — this file is the single source
 * the panel reads from.
 */
export const adminFeatures: AdminFeature[] = [
  {
    title: "Site Analytics",
    description:
      "Pageviews and CTA clicks. Currently stored per-browser (localStorage) — opens the copy held in this browser, not a shared cross-visitor view.",
    href: "/en/analytics",
    status: "live",
  },
  {
    title: "Languages",
    description:
      "3 locales live: English, Chinese, Russian — each on its own URL (/en, /zh, /ru). Edit lib/dictionaries/*.json to update copy.",
    href: "/en",
    status: "live",
  },
  {
    title: "Quote Requests",
    description:
      "Real submissions from the Quote Wizard, stored in the database. Update status as you follow up with each lead.",
    href: "/admin/quote-requests",
    status: "live",
  },
  {
    title: "Consultation Requests",
    description:
      "Same as Quote Requests — the consultation form doesn't persist submissions yet. Needs a database before this can show real data.",
    href: "#",
    status: "planned",
  },
  {
    title: "Testimonials",
    description: "Currently hardcoded in components/Testimonials.tsx. Move to a database to manage from here.",
    href: "#",
    status: "planned",
  },
  {
    title: "Blog Posts",
    description: "Currently hardcoded in lib/dictionaries/*.json. Move to a database to manage from here.",
    href: "#",
    status: "planned",
  },
];
