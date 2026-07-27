import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { creditTxn, organization } from "./db/schema";
import { planOf } from "./plans";

// Pricing data lives in plans.ts (DB-free so it stays unit-testable).
export { PACKAGES, describeTxn, type CreditPackage } from "./plans";

export type Usage = {
  planId: string;
  allowance: number;
  allowanceUsed: number;
  allowanceLeft: number;
  credits: number;
  periodStart: Date;
  periodEnd: Date;
  // Stripe subscription mirror, for the billing page banner/renewal line.
  billingStatus: string | null;
  renewsAt: Date | null;
};

export async function getUsage(orgId: string): Promise<Usage> {
  const o = await db.query.organization.findFirst({ where: eq(organization.id, orgId) });
  const plan = planOf(o?.plan);
  const start = o?.periodStart ?? new Date();
  // Show the roll that WOULD happen on next use, so the dashboard never reports
  // a stale period.
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const rolled = end.getTime() <= Date.now();
  const used = rolled ? 0 : (o?.allowanceUsed ?? 0);
  const effectiveStart = rolled ? new Date() : start;
  const effectiveEnd = new Date(effectiveStart);
  effectiveEnd.setMonth(effectiveEnd.getMonth() + 1);
  return {
    planId: plan.id,
    allowance: plan.monthlyMessages,
    allowanceUsed: used,
    allowanceLeft: Math.max(0, plan.monthlyMessages - used),
    credits: o?.credits ?? 0,
    periodStart: effectiveStart,
    periodEnd: effectiveEnd,
    billingStatus: o?.stripeStatus ?? null,
    renewsAt: o?.stripePeriodEnd ?? null,
  };
}

// Meter one user message. Spends the monthly allowance first, then purchased
// credits. The period rolls lazily on first use after it expires.
//
// Done as ONE statement so concurrent messages cannot both pass the final unit:
// every CASE reads the pre-update row, and the WHERE clause only matches when
// capacity actually exists, so an out-of-quota org updates zero rows.
// The result records WHICH bucket paid, so a failed upstream call can refund
// the same one (see refundMessage).
export type ChargeResult = { ok: false } | { ok: true; spentCredit: boolean };

export async function consumeMessage(orgId: string, reason = "message"): Promise<ChargeResult> {
  const o = await db.query.organization.findFirst({ where: eq(organization.id, orgId) });
  if (!o) return { ok: false };
  const limit = planOf(o.plan).monthlyMessages;

  const rows = (await db.execute(sql`
    update "organization" set
      "periodStart" = case when "periodStart" < now() - interval '1 month' then now() else "periodStart" end,
      "allowanceUsed" = case
        when "periodStart" < now() - interval '1 month' then 1
        when "allowanceUsed" < ${limit} then "allowanceUsed" + 1
        else "allowanceUsed" end,
      "credits" = case
        when "periodStart" < now() - interval '1 month' then "credits"
        when "allowanceUsed" < ${limit} then "credits"
        when "credits" > 0 then "credits" - 1
        else "credits" end
    where "id" = ${orgId}
      and ("periodStart" < now() - interval '1 month'
           or "allowanceUsed" < ${limit}
           or "credits" > 0)
    returning "allowanceUsed", "credits"
  `)) as unknown as Array<{ allowanceUsed: number; credits: number }>;

  if (!rows || rows.length === 0) return { ok: false }; // out of allowance and credits

  // Only log a ledger row when a purchased credit was actually spent; allowance
  // usage would otherwise flood the ledger.
  const spentCredit = Number(rows[0].credits) < o.credits;
  if (spentCredit) {
    await db.insert(creditTxn).values({ organizationId: orgId, delta: -1, reason: `${reason}:overage` }).catch(() => {});
  }
  return { ok: true, spentCredit };
}

// Compensate a charge whose upstream call failed outright: the visitor got no
// answer, so the org should not pay. Refunds the bucket the charge came from --
// purchased credits get a ledger row (pairing the -1 overage entry); the
// allowance never hits the ledger, so it is decremented directly, floored at 0
// in case the period rolled between charge and refund.
export async function refundMessage(orgId: string, spentCredit: boolean, reason = "refund:upstream_failed"): Promise<void> {
  if (spentCredit) {
    await addCredits(orgId, 1, reason);
  } else {
    await db.execute(sql`update "organization" set "allowanceUsed" = greatest("allowanceUsed" - 1, 0) where "id" = ${orgId}`);
  }
}

export async function addCredits(orgId: string, amount: number, reason: string): Promise<void> {
  await db.update(organization).set({ credits: sql`${organization.credits} + ${amount}` }).where(eq(organization.id, orgId));
  await db.insert(creditTxn).values({ organizationId: orgId, delta: amount, reason });
}

export async function recentTxns(orgId: string, limit = 10) {
  return db.select().from(creditTxn).where(eq(creditTxn.organizationId, orgId)).orderBy(desc(creditTxn.createdAt)).limit(limit);
}
