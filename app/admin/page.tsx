import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, sql } from "drizzle-orm";
import { getServerSession } from "@/lib/server-auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { bot, chatSession, creditTxn, member, organization, user } from "@/lib/db/schema";
import { PLANS, planOf } from "@/lib/plans";
import { AreaChart, CHART_COLORS, Donut, GoalBar, Sparkline } from "./charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin - ChatFlowGate", robots: { index: false, follow: false } };

const DAYS = 30;

/** Buckets timestamps into per-day counts for the last DAYS days, oldest first. */
function dailyCounts(dates: (Date | string | null | undefined)[]): number[] {
  const counts = new Array(DAYS).fill(0);
  const today = Math.floor(Date.now() / 86_400_000);
  for (const d of dates) {
    if (!d) continue;
    const day = Math.floor(new Date(d).getTime() / 86_400_000);
    const idx = DAYS - 1 - (today - day);
    if (idx >= 0 && idx < DAYS) counts[idx] += 1;
  }
  return counts;
}

/**
 * Founders-only view of the whole install: signups, workspaces, activation, chat
 * volume and subscription revenue across every organization. This is the one
 * page that deliberately ignores org scoping, which is why the allow-list check
 * runs before any query. Everyone else is redirected as if it did not exist.
 *
 * Every number is computed from real rows. Nothing here is a placeholder.
 */
export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.email)) redirect("/dashboard");

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [users, orgs, bots, sessions, topBots, credits] = await Promise.all([
    db.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }).from(user),
    db
      .select({
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
        createdAt: organization.createdAt,
        status: organization.stripeStatus,
      })
      .from(organization),
    db.select({ id: bot.id, orgId: bot.organizationId, createdAt: bot.createdAt }).from(bot),
    db
      .select({ botId: chatSession.botId, messages: chatSession.messages, createdAt: chatSession.createdAt })
      .from(chatSession),
    db
      .select({
        name: bot.name,
        org: organization.name,
        sessions: sql<number>`count(${chatSession.id})::int`,
        messages: sql<number>`coalesce(sum(${chatSession.messages}), 0)::int`,
      })
      .from(bot)
      .leftJoin(chatSession, sql`${chatSession.botId} = ${bot.id}`)
      .leftJoin(organization, sql`${organization.id} = ${bot.organizationId}`)
      .groupBy(bot.id, bot.name, organization.name)
      .orderBy(desc(sql`coalesce(sum(${chatSession.messages}), 0)`))
      .limit(8),
    db.select({ delta: creditTxn.delta, reason: creditTxn.reason }).from(creditTxn),
  ]);

  // Which workspaces each user belongs to, so the signups table can show it.
  const members = await db
    .select({ userId: member.userId, orgId: member.organizationId })
    .from(member);
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const orgOfUser = new Map(members.map((m) => [m.userId, orgById.get(m.orgId)?.name ?? "-"]));

  const botsPerOrg = new Map<string, number>();
  for (const b of bots) botsPerOrg.set(b.orgId, (botsPerOrg.get(b.orgId) ?? 0) + 1);

  const totalMessages = sessions.reduce((s, r) => s + (r.messages ?? 0), 0);
  const activatedOrgs = botsPerOrg.size;
  const paidOrgs = orgs.filter((o) => planOf(o.plan).price > 0);
  const mrr = paidOrgs.reduce((s, o) => s + planOf(o.plan).price, 0);
  const creditsSold = credits.filter((c) => c.delta > 0).reduce((s, c) => s + c.delta, 0);

  const signupsDaily = dailyCounts(users.map((u) => u.createdAt));
  const sessionsDaily = dailyCounts(sessions.map((s) => s.createdAt));
  const botsDaily = dailyCounts(bots.map((b) => b.createdAt));

  const cards = [
    {
      label: "Users",
      value: users.length.toLocaleString(),
      spark: signupsDaily,
      delta: `+${users.filter((u) => u.createdAt >= weekAgo).length} this week`,
    },
    {
      label: "Workspaces",
      value: orgs.length.toLocaleString(),
      spark: signupsDaily,
      delta: `${activatedOrgs} with a bot`,
    },
    {
      label: "Bots",
      value: bots.length.toLocaleString(),
      spark: botsDaily,
      delta: `${sessions.length.toLocaleString()} chat sessions`,
    },
    {
      label: "MRR",
      value: `$${mrr.toLocaleString()}`,
      spark: sessionsDaily,
      delta: `${paidOrgs.length} paying · ${creditsSold.toLocaleString()} credits sold`,
    },
  ];

  const planSlices = Object.values(PLANS)
    .map((p, i) => ({
      label: p.label,
      value: orgs.filter((o) => planOf(o.plan).id === p.id).length,
      color: CHART_COLORS[i],
    }))
    .filter((s) => s.value > 0);

  const dayLabels = Array.from({ length: DAYS }, (_, i) => {
    if (i !== 0 && i !== DAYS - 1 && i % 7 !== 0) return "";
    const d = new Date(Date.now() - (DAYS - 1 - i) * 86_400_000);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const recent = [...users].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 15);

  const card = "rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40";
  const muted = "text-neutral-500 dark:text-neutral-400";
  const th = "px-4 py-2 text-left text-xs font-medium";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Admin</h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Founders only. Every workspace, live from the database.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={card}>
            <p className={`text-xs ${muted}`}>{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
            <p className={`text-xs ${muted}`}>{c.delta}</p>
            <div className="mt-2">
              <Sparkline points={c.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className={card}>
          <h2 className="text-sm font-medium">Daily activity, last {DAYS} days</h2>
          <div className="mt-3">
            <AreaChart
              labels={dayLabels}
              series={[
                { name: "Chat sessions", color: CHART_COLORS[0], points: sessionsDaily },
                { name: "Signups", color: CHART_COLORS[2], points: signupsDaily },
              ]}
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-sm font-medium">Workspaces by plan</h2>
            <div className="mt-3">
              {planSlices.length > 0 ? <Donut slices={planSlices} unit="orgs" /> : <p className={`text-sm ${muted}`}>No workspaces yet.</p>}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-medium">Early goals</h2>
            <div className="mt-3 space-y-4">
              <GoalBar label="Users onboarded" value={users.length} target={20} />
              <GoalBar label="Activated (has a bot)" value={activatedOrgs} target={10} />
              <GoalBar label="Messages handled" value={totalMessages} target={1000} />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6">
        <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Busiest bots</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b border-neutral-200 dark:border-neutral-800 ${muted}`}>
                <th className={th}>Bot</th>
                <th className={th}>Workspace</th>
                <th className={th}>Sessions</th>
                <th className={th}>Messages</th>
              </tr>
            </thead>
            <tbody>
              {topBots.length === 0 && (
                <tr>
                  <td className={`px-4 py-3 ${muted}`} colSpan={4}>
                    No bots yet.
                  </td>
                </tr>
              )}
              {topBots.map((b, i) => (
                <tr key={i} className="border-b border-neutral-200 last:border-0 dark:border-neutral-800">
                  <td className="px-4 py-2">{b.name}</td>
                  <td className={`px-4 py-2 ${muted}`}>{b.org ?? "-"}</td>
                  <td className="px-4 py-2 tabular-nums">{b.sessions}</td>
                  <td className="px-4 py-2 tabular-nums">{b.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Recent signups</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b border-neutral-200 dark:border-neutral-800 ${muted}`}>
                <th className={th}>Email</th>
                <th className={th}>Name</th>
                <th className={th}>Workspace</th>
                <th className={th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u) => (
                <tr key={u.id} className="border-b border-neutral-200 last:border-0 dark:border-neutral-800">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className={`px-4 py-2 ${muted}`}>{u.name || "-"}</td>
                  <td className={`px-4 py-2 ${muted}`}>{orgOfUser.get(u.id) ?? "-"}</td>
                  <td className={`px-4 py-2 ${muted}`}>{new Date(u.createdAt).toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
