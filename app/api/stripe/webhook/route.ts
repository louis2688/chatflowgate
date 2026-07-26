import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { creditTxn, organization, stripeEvent } from "@/lib/db/schema";
import { PACKAGES, PLANS } from "@/lib/plans";
import { addCredits } from "@/lib/credits";
import { planFromLookupKey, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Stripe retries deliveries, so every branch here must be idempotent.
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  let event: Stripe.Event;
  try {
    const sig = req.headers.get("stripe-signature");
    event = await s.webhooks.constructEventAsync(await req.text(), sig ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // Idempotency gate: record the event id first; a redelivery finds the row
  // and stops here, so no handler runs twice.
  const fresh = await db
    .insert(stripeEvent)
    .values({ stripeEventId: event.id, type: event.type })
    .onConflictDoNothing({ target: stripeEvent.stripeEventId })
    .returning({ id: stripeEvent.id });
  if (fresh.length === 0) return NextResponse.json({ received: true, duplicate: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      if (!orgId) break;

      if (session.metadata?.kind === "package" && session.payment_status === "paid") {
        const pkg = PACKAGES.find((p) => p.id === session.metadata?.packageId);
        if (!pkg) break;
        // The reason embeds the checkout session id: it is the idempotency
        // key that makes Stripe's redelivery retries safe.
        const reason = `purchase:${pkg.id}:${session.id}`;
        const seen = await db.query.creditTxn.findFirst({
          where: and(eq(creditTxn.organizationId, orgId), eq(creditTxn.reason, reason)),
        });
        if (!seen) await addCredits(orgId, pkg.credits, reason);
      } else if (session.metadata?.kind === "plan") {
        const planId = session.metadata?.planId ?? "";
        if (!Object.hasOwn(PLANS, planId)) break;
        // New paid period starts now; the allowance resets with it.
        await db
          .update(organization)
          .set({
            plan: planId,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            stripeStatus: "active",
            periodStart: new Date(),
            allowanceUsed: 0,
          })
          .where(eq(organization.id, orgId));
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      // Covers plan switches made anywhere (our UI or the Billing Portal).
      const planId = planFromLookupKey(sub.items.data[0]?.price?.lookup_key);
      // Newer Stripe API versions carry the billing period on the item.
      const periodEnd = sub.items.data[0]?.current_period_end;
      await db
        .update(organization)
        .set({
          ...(sub.status === "active" && planId ? { plan: planId, stripeSubscriptionId: sub.id } : {}),
          stripeStatus: sub.status,
          stripePeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        })
        .where(eq(organization.stripeCustomerId, String(sub.customer)));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await db
        .update(organization)
        .set({ plan: "free", stripeSubscriptionId: null, stripeStatus: "canceled", stripePeriodEnd: null })
        .where(eq(organization.stripeSubscriptionId, sub.id));
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customer = typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customer) break;
      await db
        .update(organization)
        .set({ stripeStatus: "past_due" })
        .where(eq(organization.stripeCustomerId, customer));
      // Notification placeholder: wire to email/Slack when a channel exists.
      console.error(`[billing] payment_failed customer=${customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
