import { eq } from "drizzle-orm";
import { requireContext } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { invitation, member, organization, user } from "@/lib/db/schema";
import { listApiKeys } from "@/lib/apikeys";
import { inviteMemberAction, updateOrgAction } from "@/app/(dash)/actions";
import ApiKeys from "@/components/dash/ApiKeys";
import NameForm from "@/components/dash/NameForm";
import DeleteAccount from "@/components/dash/DeleteAccount";

export const dynamic = "force-dynamic";

const field = "rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-500";
const label = "block text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400 mb-1.5";
const card = "rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-6";

export default async function SettingsPage() {
  const ctx = await requireContext();
  const org = await db.query.organization.findFirst({ where: eq(organization.id, ctx.orgId) });
  const members = await db
    .select({ id: member.id, role: member.role, email: user.email, name: user.name })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, ctx.orgId));
  const invites = await db.select().from(invitation).where(eq(invitation.organizationId, ctx.orgId));
  const keys = await listApiKeys(ctx.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Profile, workspace, team, white-label, and API access.</p>
      </div>

      <section className={card}>
        <h2 className="text-lg font-semibold">Your profile</h2>
        <p className="mb-4 mt-1 text-sm text-neutral-600 dark:text-neutral-400">Display name shown across the dashboard.</p>
        <NameForm initial={ctx.user.name || ""} />
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">White-label branding</h2>
        <p className="mb-4 mt-1 text-sm text-neutral-600 dark:text-neutral-400">Rebrand the dashboard and widgets for your clients.</p>
        <form action={updateOrgAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="brandName">Brand name</label>
              <input id="brandName" name="brandName" defaultValue={org?.brandName ?? ""} placeholder={org?.name} className={`${field} w-full`} />
            </div>
            <div>
              <label className={label} htmlFor="customDomain">Custom domain</label>
              <input id="customDomain" name="customDomain" defaultValue={org?.customDomain ?? ""} placeholder="support.client.com" className={`${field} w-full`} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 dark:text-neutral-300">
            <input type="checkbox" name="hideBranding" defaultChecked={org?.hideBranding ?? false} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-900" />
            Hide &quot;Protected by Chatnode&quot; footer
          </label>
          <button type="submit" className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-white hover:bg-emerald-400">Save branding</button>
        </form>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="mb-4 mt-1 text-sm text-neutral-600 dark:text-neutral-400">Members of {ctx.orgName}.</p>
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between bg-white dark:bg-neutral-900/40 px-4 py-3 text-sm">
              <span>{m.name || m.email} <span className="text-neutral-500">&middot; {m.email}</span></span>
              <span className="text-xs uppercase tracking-wide text-neutral-500">{m.role}</span>
            </li>
          ))}
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/20 px-4 py-3 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">{i.email}</span>
              <span className="text-xs uppercase tracking-wide text-amber-500">invited</span>
            </li>
          ))}
        </ul>
        <form action={inviteMemberAction} className="mt-4 flex flex-wrap items-center gap-2">
          <input name="email" type="email" required placeholder="teammate@company.com" className={field} />
          <select name="role" className={field} defaultValue="member">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500">Add / invite</button>
        </form>
        <p className="mt-2 text-xs text-neutral-500">Existing users are added immediately; new emails are recorded as pending invites (email delivery is a later integration).</p>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">API keys</h2>
        <p className="mb-4 mt-1 text-sm text-neutral-600 dark:text-neutral-400">For server-to-server calls: <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:bg-black/40 dark:text-emerald-300">X-API-Key</code> on <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:bg-black/40 dark:text-emerald-300">/api/chat/&lt;botId&gt;</code>.</p>
        <ApiKeys keys={keys} />
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Danger zone</h2>
        <div className="mt-3"><DeleteAccount /></div>
      </section>
    </div>
  );
}