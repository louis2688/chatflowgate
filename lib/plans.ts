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

// Branding removal is available from the first paid tier rather than being held
// back for a higher one: paying anything at all should be enough to remove
// someone else's name from your own site.
export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", label: "Free", price: 0, maxBots: 1, maxMembers: 1, monthlyMessages: 500, canHideBranding: false },
  lite: { id: "lite", label: "Lite", price: 19, maxBots: 3, maxMembers: 1, monthlyMessages: 5_000, canHideBranding: true },
  pro: { id: "pro", label: "Pro", price: 29, maxBots: 10, maxMembers: 3, monthlyMessages: 10_000, canHideBranding: true },
  max: { id: "max", label: "Max", price: 99, maxBots: 30, maxMembers: 6, monthlyMessages: 50_000, canHideBranding: true },
};

// Unknown/legacy values fall back to the most restrictive plan rather than the
// most permissive one, so a bad column value can never unlock paid features.
export function planOf(id: string | null | undefined): Plan {
  const key = id ?? "free";
  // hasOwn, not a truthiness check: PLANS["constructor"] and PLANS["__proto__"]
  // are truthy inherited members, so `?? PLANS.free` would never fire and the
  // caller would get a Plan whose limits are all undefined -- which compares
  // false against every >= check and removes the caps entirely.
  return Object.hasOwn(PLANS, key) ? PLANS[key as PlanId] : PLANS.free;
}

export type CreditPackage = { id: string; label: string; credits: number; price: number; popular?: boolean };

// Top-up packs, sold only on paid plans and used after the monthly allowance.
// Priced so a pack never beats subscribing (see the dominance check in the
// selfcheck): every tier includes at least what its own price buys as credits.
export const PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter", credits: 5000, price: 19 },
  { id: "growth", label: "Growth", credits: 10000, price: 25 },
  { id: "professional", label: "Professional", credits: 25000, price: 70, popular: true },
  { id: "ultimate", label: "Ultimate", credits: 100000, price: 199 },
];

// Ledger reasons are machine strings like "purchase:starter:cs_test_a1Fw...".
// Render them as something a person can read, and never surface the Stripe
// session id, which is noise to the customer.
export function describeTxn(reason: string): string {
  const [kind, detail] = reason.split(":");
  if (kind === "purchase") {
    const pack = PACKAGES.find((p) => p.id === detail);
    return pack ? `${pack.label} pack purchased` : "Credits purchased";
  }
  if (kind === "message") return detail === "overage" ? "Message (over allowance)" : "Message";
  if (kind === "refund") return "Refunded, the workflow did not reply";
  if (kind === "grant") return "Credits granted";
  return reason;
}
