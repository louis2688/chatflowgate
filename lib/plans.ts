// Plan tiers. Limits are enforced server-side in app/(dash)/actions.ts; the
// dashboard only mirrors them. Anything gated here must never be trusted from
// the client.
export type PlanId = "free" | "lite" | "pro" | "max";

export type Plan = {
  id: PlanId;
  label: string;
  price: number; // USD / month
  maxBots: number;
  maxMembers: number;
  // Messages included each month. Overage is drawn from purchased credits.
  monthlyMessages: number;
  canHideBranding: boolean;
};

// Branding removal starts at the first paid tier on purpose: the closest
// competitor sells it for $10, so gating it higher loses that comparison
// immediately.
export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", label: "Free", price: 0, maxBots: 1, maxMembers: 1, monthlyMessages: 500, canHideBranding: false },
  lite: { id: "lite", label: "Lite", price: 19, maxBots: 3, maxMembers: 1, monthlyMessages: 5_000, canHideBranding: true },
  pro: { id: "pro", label: "Pro", price: 29, maxBots: 10, maxMembers: 3, monthlyMessages: 10_000, canHideBranding: true },
  max: { id: "max", label: "Max", price: 99, maxBots: 30, maxMembers: 6, monthlyMessages: 50_000, canHideBranding: true },
};

// Unknown/legacy values fall back to the most restrictive plan rather than the
// most permissive one, so a bad column value can never unlock paid features.
export function planOf(id: string | null | undefined): Plan {
  return PLANS[(id ?? "free") as PlanId] ?? PLANS.free;
}

export type CreditPackage = { id: string; label: string; credits: number; price: number; popular?: boolean };

// Top-up packs, sold only on paid plans and used after the monthly allowance.
// Priced so a pack never beats subscribing (see the dominance check in the
// selfcheck): every tier includes at least what its own price buys as credits.
export const PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter", credits: 5000, price: 19 },
  { id: "growth", label: "Growth", credits: 10000, price: 39 },
  { id: "professional", label: "Professional", credits: 25000, price: 70, popular: true },
  { id: "ultimate", label: "Ultimate", credits: 100000, price: 199 },
];