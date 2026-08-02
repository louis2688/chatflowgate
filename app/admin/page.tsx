import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getServerSession } from "@/lib/server-auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { member, organization, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin - ChatFlowGate", robots: { index: false, follow: false } };

/**
 * Founders-only list of everyone who has signed up. This is the one page that
 * ignores org scoping on purpose, so the allow-list check runs before any query
 * and everyone else is sent to the dashboard as if it were not here.
 */
export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.email)) redirect("/dashboard");

  const [users, members, orgs] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
      .from(user)
      .orderBy(desc(user.createdAt)),
    db.select({ userId: member.userId, orgId: member.organizationId }).from(member),
    db.select({ id: organization.id, name: organization.name }).from(organization),
  ]);

  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const workspaceOf = new Map(members.map((m) => [m.userId, orgName.get(m.orgId) ?? "-"]));

  const muted = "text-neutral-500 dark:text-neutral-400";
  const th = "px-4 py-2 text-left text-xs font-medium";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Users</h1>
          <p className={`mt-1 text-sm ${muted}`}>Founders only. Live from the database.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className={`text-xs ${muted}`}>Total users</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums">{users.length.toLocaleString()}</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
            {users.length === 0 && (
              <tr>
                <td className={`px-4 py-3 ${muted}`} colSpan={4}>
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-neutral-200 last:border-0 dark:border-neutral-800">
                <td className="px-4 py-2">{u.email}</td>
                <td className={`px-4 py-2 ${muted}`}>{u.name || "-"}</td>
                <td className={`px-4 py-2 ${muted}`}>{workspaceOf.get(u.id) ?? "-"}</td>
                <td className={`px-4 py-2 ${muted}`}>{new Date(u.createdAt).toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
