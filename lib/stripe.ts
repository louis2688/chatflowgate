import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { organization } from "./db/schema";
import { PACKAGES, PLANS, type PlanId } from "./plans";

// Lazy singleton: billing works without Stripe (dev top-up) until the key is set.
let client: Stripe | null | undefined;
export function stripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}

export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Base for success/cancel/portal-return URLs. BETTER_AUTH_URL is already
// required in production and is exactly "the origin that serves the app".
export function appBaseUrl(): string {
  return (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function ensureStripeCustomer(orgId: string): Promise<string> {
  const s = stripe();
  if (!s) throw new Error("Stripe is not configured.");
  const org = await db.query.organization.findFirst({ where: eq(organization.id, orgId) });
  if (!org) throw new Error("Workspace not found.");
  if (org.stripeCustomerId) return org.stripeCustomerId;
  const customer = await s.customers.create({ name: org.name, metadata: { orgId } });
  await db.update(organization).set({ stripeCustomerId: customer.id }).where(eq(organization.id, orgId));
  return customer.id;
}

// Dashboard-managed products (optional). When set, prices are attached to
// these instead of auto-created products. Env vars, not code constants,
// because product ids are per Stripe mode: a live-mode id does not exist in
// test mode, so each environment configures the ids that match its key.
const PRODUCT_ENV: Record<Exclude<PlanId, "free">, string> = {
  lite: "STRIPE_PRODUCT_LITE",
  pro: "STRIPE_PRODUCT_PRO",
  max: "STRIPE_PRODUCT_MAX",
};

// Same rationale as PRODUCT_ENV, for the one-off credit packs: STRIPE_PRODUCT_
// plus the upper-cased pack id. Packs are single payments, so unlike plans they
// need no stable price id -- naming the product is enough. Without one Stripe
// mints a throwaway product per checkout and the dashboard slowly fills with
// duplicates of the same four packs.
//
// Derived from PACKAGES rather than a hand-written map so a fifth pack cannot
// silently ship with no product mapping. The membership test also means an
// unrecognised id can never interpolate into an arbitrary env var name.
// undefined is the honest fallback: create the product inline, as before.
export function packageProductId(packageId: string): string | undefined {
  if (!PACKAGES.some((p) => p.id === packageId)) return undefined;
  return process.env[`STRIPE_PRODUCT_${packageId.toUpperCase()}`]?.trim() || undefined;
}

// One recurring Price per paid plan, found (or created) by lookup key, so plan
// switches reference a stable price id. Created lazily on first use per Stripe
// account/mode -- nothing to set up in the dashboard.
export async function planPriceId(planId: Exclude<PlanId, "free">): Promise<string> {
  const s = stripe();
  if (!s) throw new Error("Stripe is not configured.");
  const plan = PLANS[planId];
  const lookupKey = `chatnode_${plan.id}_monthly`;
  const existing = await s.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;

  const productId = process.env[PRODUCT_ENV[planId]];
  if (productId) {
    // Adopt a matching monthly price if one was made in the dashboard, and
    // stamp our lookup key on it so the webhook can map it back to a plan.
    // plans.ts stays the source of truth: only an exact amount match counts.
    const prices = await s.prices.list({ product: productId, active: true, limit: 100 });
    const match = prices.data.find(
      (p) => p.currency === "usd" && p.unit_amount === plan.price * 100 && p.recurring?.interval === "month",
    );
    if (match) {
      if (match.lookup_key !== lookupKey) {
        await s.prices.update(match.id, { lookup_key: lookupKey }).catch(() => {});
      }
      return match.id;
    }
    const price = await s.prices.create({
      currency: "usd",
      unit_amount: plan.price * 100,
      recurring: { interval: "month" },
      lookup_key: lookupKey,
      product: productId,
      metadata: { planId: plan.id },
    });
    return price.id;
  }

  const price = await s.prices.create({
    currency: "usd",
    unit_amount: plan.price * 100,
    recurring: { interval: "month" },
    lookup_key: lookupKey,
    product_data: { name: `Chatnode ${plan.label}` },
    metadata: { planId: plan.id },
  });
  return price.id;
}

// Reverse of planPriceId: lets the webhook map a subscription's price back to
// a plan, which also covers changes made inside the Billing Portal.
export function planFromLookupKey(lookupKey: string | null | undefined): PlanId | null {
  const m = /^chatnode_(\w+)_monthly$/.exec(lookupKey ?? "");
  const id = m?.[1];
  return id && id !== "free" && Object.hasOwn(PLANS, id) ? (id as PlanId) : null;
}
