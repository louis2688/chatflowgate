import { requireContext } from "@/lib/server-auth";
import { PACKAGES, getUsage, recentTxns, type CreditPackage } from "@/lib/credits";
import { PLANS, planOf } from "@/lib/plans";
import { devTopUpAllowed } from "@/lib/config";
import { purchaseCreditsAction } from "@/app/(dash)/actions";

export const dynamic = "force-dynamic";

const card = "rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/40";
const packClass = (popular?: boolean) =>
  `flex h-full flex-col rounded-xl border p-5 ${popular ? "border-emerald-500/50 bg-emerald-500/10" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/40"}`;

function PackageBody({ p }: { p: CreditPackage }) {
  return (
    <>
      <span
        aria-hidden={!p.popular}
        className={`mb-2 inline-block self-start rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
          p.popular ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "invisible"
        }`}
      >
        Popular
      </span>
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{p.label}</p>
      <p className="mt-1 text-2xl font-semibold">${p.price}</p>
      <p className="mb-4 text-xs text-neutral-500">{p.credits.toLocaleString()} messages</p>
    </>
  );
}

export default async function BillingPage() {
  const { orgId } = await requireContext();
  const [usage, txns] = await Promise.all([getUsage(orgId), recentTxns(orgId)]);
  const plan = planOf(usage.planId);
  const stripeOn = !!process.env.STRIPE_SECRET_KEY;
  const canTopUp = devTopUpAllowed() && plan.id !== "free";
  const pct = Math.min(100, Math.round((usage.allowanceUsed / usage.allowance) * 100));
  const resets = usage.periodEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Each plan includes a monthly message allowance. Top-up credits cover anything beyond it and never expire.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${card} sm:col-span-2`}>
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Messages this period</p>
            <p className="text-xs text-neutral-500">resets {resets}</p>
          </div>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {usage.allowanceUsed.toLocaleString()}
            <span className="text-lg font-normal text-neutral-500"> / {usage.allowance.toLocaleString()}</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
            <div className={`h-full ${pct >= 100 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {usage.allowanceLeft > 0
              ? `${usage.allowanceLeft.toLocaleString()} left on your ${plan.label} plan.`
              : "Allowance used. Further messages draw from top-up credits."}
          </p>
        </div>

        <div className={card}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Top-up credits</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-500">{usage.credits.toLocaleString()}</p>
          <p className="mt-2 text-xs text-neutral-500">Used only after the allowance runs out. Never expire.</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold">Plans</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {Object.values(PLANS).map((pl) => (
            <div key={pl.id} className={`rounded-xl border p-4 ${pl.id === plan.id ? "border-emerald-500/60 bg-emerald-500/10" : "border-neutral-200 dark:border-neutral-800"}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium">{pl.label}</p>
                {pl.id === plan.id && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-600 dark:text-emerald-400">Current</span>}
              </div>
              <p className="mt-1 text-2xl font-semibold">${pl.price}<span className="text-sm font-normal text-neutral-500">/mo</span></p>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <li>{pl.monthlyMessages.toLocaleString()} messages / month</li>
                <li>{pl.maxBots} bot{pl.maxBots === 1 ? "" : "s"}, {pl.maxMembers} seat{pl.maxMembers === 1 ? "" : "s"}</li>
                <li>{pl.canHideBranding ? "Badge removed" : "Chatnode badge shown"}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Top up</h2>
        {plan.id === "free" ? (
          <p className="mb-3 mt-1 text-sm text-neutral-500">Top-up credits are available on paid plans. Upgrade to buy extra messages.</p>
        ) : canTopUp ? (
          <p className="mb-3 mt-1 text-xs text-amber-500">Dev mode: purchases top up instantly with no payment. This is disabled in production.</p>
        ) : (
          <p className="mb-3 mt-1 text-xs text-neutral-500">Checkout is not live yet. Get in touch and we will top up your workspace manually.</p>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) =>
            canTopUp ? (
              <form key={p.id} action={purchaseCreditsAction} className={packClass(p.popular)}>
                <input type="hidden" name="packageId" value={p.id} />
                <PackageBody p={p} />
                <button type="submit" className="mt-auto w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-400">
                  {stripeOn ? "Buy" : "Add (dev)"}
                </button>
              </form>
            ) : (
              <div key={p.id} className={packClass(p.popular)}>
                <PackageBody p={p} />
                <button type="button" disabled className="mt-auto w-full cursor-not-allowed rounded-lg bg-neutral-200 px-3 py-2 text-sm font-medium text-neutral-500 dark:bg-neutral-800">
                  {plan.id === "free" ? "Paid plans only" : "Coming soon"}
                </button>
              </div>
            ),
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <ul className="mt-3 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {txns.length === 0 && <li className="bg-white px-4 py-3 text-sm text-neutral-500 dark:bg-neutral-900/40">No activity yet.</li>}
          {txns.map((t) => (
            <li key={t.id} className="flex items-center justify-between bg-white px-4 py-2.5 text-sm dark:bg-neutral-900/40">
              <span className="text-neutral-600 dark:text-neutral-400">{t.reason}</span>
              <span className={t.delta < 0 ? "tabular-nums text-neutral-500" : "tabular-nums text-emerald-500"}>{t.delta > 0 ? "+" : ""}{t.delta.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}