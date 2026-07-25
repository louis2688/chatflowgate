// Plan tiers. Limits are enforced server-side in app/(dash)/actions.ts; the
// dashboard only mirrors them. Anything gated here must never be trusted from
// the client.
export type PlanId = "free" | "pro" | "max";

export type Plan = {
  id: PlanId;
  label: string;
  price: number; // USD / month
  maxBots: number;
  maxMembers: number;
  canHideBranding: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", label: "Free", price: 0, maxBots: 1, maxMembers: 1, canHideBranding: false },
  pro: { id: "pro", label: "Pro", price: 29, maxBots: 10, maxMembers: 3, canHideBranding: true },
  max: { id: "max", label: "Max", price: 79, maxBots: 30, maxMembers: 6, canHideBranding: true },
};

// Unknown/legacy values fall back to the most restrictive plan rather than the
// most permissive one, so a bad column value can never unlock paid features.
export function planOf(id: string | null | undefined): Plan {
  return PLANS[(id ?? "free") as PlanId] ?? PLANS.free;
}