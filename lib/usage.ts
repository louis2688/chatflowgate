import { and, count, eq } from "drizzle-orm";
import { db } from "./db";
import { bot, invitation, member, organization } from "./db/schema";
import { planOf, type Plan } from "./plans";

export type OrgUsage = { plan: Plan; bots: number; seats: number };

// Current plan + what the org is actually using. Seats count accepted members
// AND still-pending invitations: without that a 1-seat workspace could send
// unlimited invites and blow past the limit the moment they are accepted.
export async function orgUsage(orgId: string): Promise<OrgUsage> {
  const [org, bots, members, pending] = await Promise.all([
    db.query.organization.findFirst({ where: eq(organization.id, orgId) }),
    db.select({ n: count() }).from(bot).where(eq(bot.organizationId, orgId)),
    db.select({ n: count() }).from(member).where(eq(member.organizationId, orgId)),
    db
      .select({ n: count() })
      .from(invitation)
      .where(and(eq(invitation.organizationId, orgId), eq(invitation.status, "pending"))),
  ]);
  return {
    plan: planOf(org?.plan),
    bots: bots[0]?.n ?? 0,
    seats: (members[0]?.n ?? 0) + (pending[0]?.n ?? 0),
  };
}