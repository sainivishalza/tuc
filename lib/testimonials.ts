export interface Testimonial {
  name: string;
  company: string;
  quote: string;
  rating: number;
  locale?: string;
}

/**
 * Add real client reviews here as orders complete.
 * The Testimonials component automatically shows a "coming soon"
 * placeholder when this array is empty.
 *
 * To add a review, push an object like:
 * { name: "Jane D.", company: "Acme Corp", rating: 5, quote: "Excellent sourcing..." }
 */
export const testimonials: Testimonial[] = [];
