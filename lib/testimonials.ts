// Real customer quotes only.
//
// Add an entry ONLY when the person actually said it and has agreed to be
// quoted by name. Invented or embellished testimonials are illegal in the
// markets Chatnode sells into (the FTC's 2024 rule on fake reviews and
// testimonials, and the EU Unfair Commercial Practices Directive), and a
// fabricated star rating in the page schema breaches Google's structured data
// policy, which risks a manual action against the whole domain.
//
// The section and the AggregateRating schema render only when this array has
// entries, so leaving it empty is safe: the page simply omits them.
export type Testimonial = {
  quote: string;
  name: string;
  role: string; // e.g. "founder, Acme Automations"
  rating?: number; // 1-5, only if the person actually gave one
};

export const TESTIMONIALS: Testimonial[] = [];

export function averageRating(list: Testimonial[] = TESTIMONIALS): number | null {
  const rated = list.filter((t) => typeof t.rating === "number");
  if (rated.length === 0) return null;
  return rated.reduce((sum, t) => sum + (t.rating as number), 0) / rated.length;
}
