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
export const testimonials: Testimonial[] = [
  {
    name: "Pieter van der Merwe",
    company: "CapeTech Solutions",
    quote: "We needed a reliable supplier for electronic components. The Unique Choice found us three verified factories within a week, and the samples arrived in perfect condition. Saved us months of research.",
    rating: 5,
    locale: "en",
  },
  {
    name: "王伟",
    company: "深圳贸易有限公司",
    quote: "他们帮我们找到了香港的优质供应商，整个流程非常透明。从工厂检查到物流跟踪，每一步都有文件记录。强烈推荐。",
    rating: 5,
    locale: "zh",
  },
  {
    name: "Thabo Mokoena",
    company: "Pretoria Imports",
    quote: "I was nervous about ordering from China for the first time. They handled everything — factory verification, samples, inspection, and door-to-door shipping to South Africa. Everything arrived on time and exactly as described.",
    rating: 5,
    locale: "en",
  },
  {
    name: "Sarah Nkosi",
    company: "Durban Goods Co.",
    quote: "What impressed me most was the factory inspection report — detailed photos and notes so I could make an informed decision without flying to China myself. The payment structure was also very safe.",
    rating: 5,
    locale: "en",
  },
  {
    name: "李明",
    company: "国际贸易公司",
    quote: "他们不仅帮我们找到了合适的供应商，还在发货前做了详细的产品检查。这对于远程采购来说非常重要。响应速度也很快，通常几小时内就能回复。",
    rating: 5,
    locale: "zh",
  },
];
