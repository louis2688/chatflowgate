import Link from "next/link";
import { requireContext } from "@/lib/server-auth";
import { recentTxns } from "@/lib/credits";
import { describeTxn } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing activity - ChatFlowGate" };

export default async function ActivityPage() {
  const { orgId } = await requireContext();
  const txns = await recentTxns(orgId, 200);

  const td = "px-4 py-2.5";
  return (
    <div className="space-y-6">
      <div>
        <Link href="/billing" className="text-sm text-emerald-500 hover:underline">&larr; Billing</Link>
        <h1 className="font-display mt-2 text-2xl font-semibold">Billing activity</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Credit purchases, refunds, and messages charged beyond your monthly allowance. Messages inside the allowance are
          counted, not itemised here.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/40">
        {txns.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
                  <th className={`${td} font-medium text-neutral-500`}>Date</th>
                  <th className={`${td} font-medium text-neutral-500`}>Activity</th>
                  <th className={`${td} text-right font-medium text-neutral-500`}>Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {txns.map((t) => (
                  <tr key={t.id}>
                    <td className={`${td} whitespace-nowrap text-neutral-500`}>
                      {new Date(t.createdAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className={td}>{describeTxn(t.reason)}</td>
                    <td className={`${td} whitespace-nowrap text-right tabular-nums ${t.delta < 0 ? "text-neutral-500" : "text-emerald-500"}`}>
                      {t.delta > 0 ? "+" : ""}
                      {t.delta.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {txns.length >= 200 && (
        <p className="text-xs text-neutral-500">Showing the most recent 200 entries.</p>
      )}
    </div>
  );
}