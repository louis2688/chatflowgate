import { requireContext } from "@/lib/server-auth";
import {
  browserBreakdown,
  countryBreakdown,
  dailySessions,
  orgStats,
  perBotCounts,
  recentSessions,
} from "@/lib/analytics";
import { listIpBans } from "@/lib/ipbans";
import { banIpAction, unbanIpAction } from "@/app/(dash)/actions";
import ActionForm from "@/components/dash/ActionForm";
import SubmitButton from "@/components/dash/SubmitButton";
import BarChart from "@/components/dash/BarChart";

export const dynamic = "force-dynamic";

const card = "rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-6";

function Breakdown({ title, rows }: { title: string; rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className={card}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, 6).map((r) => (
            <li key={r.label} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700 dark:text-neutral-300">{r.label}</span>
                <span className="tabular-nums text-neutral-500">{r.n.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                <div className="h-full bg-emerald-500" style={{ width: `${(r.n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AnalyticsPage() {
  const { orgId } = await requireContext();
  const [stats, daily, perBot, browsers, countries, sessions, bans] = await Promise.all([
    orgStats(orgId),
    dailySessions(orgId, 14),
    perBotCounts(orgId),
    browserBreakdown(orgId),
    countryBreakdown(orgId),
    recentSessions(orgId, 50),
    listIpBans(orgId),
  ]);
  const bannedIps = new Set(bans.map((b) => b.ip));
  const cards: [string, number][] = [
    ["Bots", stats.bots],
    ["Sessions", stats.sessions],
    ["Messages", stats.messages],
    ["Countries", stats.countries],
  ];
  const th = "px-3 py-2 text-left font-medium text-neutral-500";
  const td = "px-3 py-2 whitespace-nowrap";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Sessions across your workspace. No message content is stored.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-5">
            <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className="mb-4 text-lg font-semibold">Sessions, last 14 days</h2>
        <BarChart data={daily} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Top browsers" rows={browsers} />
        <Breakdown title="Top countries" rows={countries} />
        <div className={card}>
          <h2 className="mb-3 text-lg font-semibold">By bot</h2>
          {perBot.length === 0 ? (
            <p className="text-sm text-neutral-500">No bots yet.</p>
          ) : (
            <ul className="space-y-2">
              {perBot.map((b) => (
                <li key={b.name} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">{b.name}</span>
                  <span className="tabular-nums text-neutral-500">{b.n.toLocaleString()} sessions</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">Recent sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">No sessions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className={th}>Bot</th>
                  <th className={th}>IP</th>
                  <th className={th}>Browser</th>
                  <th className={th}>OS</th>
                  <th className={th}>Country</th>
                  <th className={th}>Msgs</th>
                  <th className={th}>Last seen</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {sessions.map((s) => {
                  const banned = s.ip ? bannedIps.has(s.ip) : false;
                  return (
                    <tr key={s.id}>
                      <td className={td}>{s.botName}</td>
                      <td className={`${td} font-mono text-xs`}>{s.ip ?? "unknown"}</td>
                      <td className={td}>{s.browser ?? "-"}{s.device && s.device !== "desktop" ? ` (${s.device})` : ""}</td>
                      <td className={td}>{s.os ?? "-"}</td>
                      <td className={td}>{s.country ?? "-"}</td>
                      <td className={`${td} tabular-nums`}>{s.messages}</td>
                      <td className={`${td} text-neutral-500`}>{new Date(s.lastSeenAt).toLocaleString()}</td>
                      <td className={td}>
                        {!s.ip || s.ip === "unknown" ? null : banned ? (
                          <ActionForm action={unbanIpAction}>
                            <input type="hidden" name="banId" value={bans.find((b) => b.ip === s.ip)?.id ?? ""} />
                            <SubmitButton className="text-xs text-neutral-500 hover:text-neutral-300">Unban</SubmitButton>
                          </ActionForm>
                        ) : (
                          <ActionForm action={banIpAction}>
                            <input type="hidden" name="ip" value={s.ip} />
                            <SubmitButton className="text-xs text-red-400 hover:text-red-300">Ban IP</SubmitButton>
                          </ActionForm>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}