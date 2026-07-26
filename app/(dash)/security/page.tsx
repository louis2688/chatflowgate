import { requireContext } from "@/lib/server-auth";
import { listIpBans } from "@/lib/ipbans";
import { banIpAction, unbanIpAction } from "@/app/(dash)/actions";
import ActionForm from "@/components/dash/ActionForm";
import SubmitButton from "@/components/dash/SubmitButton";

export const dynamic = "force-dynamic";

const card = "rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-6";
const field = "rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-500";

export default async function SecurityPage() {
  const { orgId } = await requireContext();
  const bans = await listIpBans(orgId);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Ban abusive IP addresses. A banned IP is rejected at the chat gateway before any request reaches your bots.
        </p>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">Ban an IP</h2>
        <ActionForm action={banIpAction} className="flex flex-wrap items-center gap-2">
          <input name="ip" required placeholder="e.g. 203.0.113.9" className={`${field} font-mono`} />
          <input name="reason" placeholder="Reason (optional)" className={field} />
          <SubmitButton pendingLabel="Banning..." className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400">Ban IP</SubmitButton>
        </ActionForm>
        <p className="mt-2 text-xs text-neutral-500">Tip: you can also ban an IP straight from the Recent sessions table in Analytics.</p>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">Banned IPs</h2>
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          {bans.length === 0 && <li className="px-4 py-3 text-sm text-neutral-500">No banned IPs.</li>}
          {bans.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4 bg-white dark:bg-neutral-900/40 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-mono text-sm font-medium">{b.ip}</span>
                <span className="block truncate text-xs text-neutral-500">
                  {b.reason || "no reason"} &middot; {new Date(b.createdAt).toLocaleDateString()}
                </span>
              </span>
              <ActionForm action={unbanIpAction}>
                <input type="hidden" name="banId" value={b.id} />
                <SubmitButton pendingLabel="..." className="shrink-0 text-xs text-neutral-500 hover:text-neutral-300">Unban</SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}