import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { bot, member, organization } from "./db/schema";
import { readableText } from "./contrast";
import { planOf } from "./plans";

export type Bot = typeof bot.$inferSelect;
export type PublicBotConfig = {
  id: string;
  name: string;
  welcome: string;
  color: string;
  brandFg: string;
  logoUrl: string | null;
  suggestedPrompts: string[];
  allowAnonymous: boolean;
  leadTitle: string | null;
  leadSubtitle: string | null;
  leadName: boolean;
  leadEmail: boolean;
  leadPhone: boolean;
  leadMessage: boolean;
  locale: string;
  rtl: boolean;
  consentRequired: boolean;
  consentText: string | null;
  allowFileUpload: boolean;
  maxFileSizeMb: number;
  allowedFileTypes: string[];
};

export async function getBot(id: string): Promise<Bot | undefined> {
  return db.query.bot.findFirst({ where: eq(bot.id, id) });
}

export async function listBots(orgId: string): Promise<Bot[]> {
  return db.select().from(bot).where(eq(bot.organizationId, orgId)).orderBy(desc(bot.createdAt));
}

export async function createBot(orgId: string, data: Partial<Bot> & { name: string; webhookUrl: string }) {
  const [row] = await db
    .insert(bot)
    .values({ ...data, organizationId: orgId, suggestedPrompts: data.suggestedPrompts ?? [], allowedOrigins: data.allowedOrigins ?? [] })
    .returning();
  return row;
}

// Update scoped to org so one org can't touch another's bot.
export async function updateBot(orgId: string, id: string, data: Partial<Bot>) {
  const existing = await getBot(id);
  if (!existing || existing.organizationId !== orgId) return null;
  const { id: _i, organizationId: _o, createdAt: _c, ...safe } = data;
  const [row] = await db.update(bot).set(safe).where(eq(bot.id, id)).returning();
  return row;
}

export async function deleteBot(orgId: string, id: string) {
  const existing = await getBot(id);
  if (!existing || existing.organizationId !== orgId) return false;
  await db.delete(bot).where(eq(bot.id, id));
  return true;
}

export function publicConfig(b: Bot): PublicBotConfig {
  return {
    id: b.id,
    name: b.name,
    welcome: b.welcome,
    color: b.color,
    brandFg: readableText(b.color),
    logoUrl: b.logoUrl,
    suggestedPrompts: b.suggestedPrompts ?? [],
    allowAnonymous: b.allowAnonymous,
    leadTitle: b.leadTitle,
    leadSubtitle: b.leadSubtitle,
    leadName: b.leadName,
    leadEmail: b.leadEmail,
    leadPhone: b.leadPhone,
    leadMessage: b.leadMessage,
    locale: b.locale,
    rtl: b.rtl,
    consentRequired: b.consentRequired,
    consentText: b.consentText,
    allowFileUpload: b.allowFileUpload,
    maxFileSizeMb: b.maxFileSizeMb,
    allowedFileTypes: b.allowedFileTypes ?? [],
  };
}

export async function orgHideBranding(orgId: string): Promise<boolean> {
  const o = await db.query.organization.findFirst({ where: eq(organization.id, orgId) });
  // Checked at read time as well as on save, so a downgrade restores the badge
  // even though the stored flag is still true.
  return (o?.hideBranding ?? false) && planOf(o?.plan).canHideBranding;
}

export async function isOrgMember(userId: string, orgId: string): Promise<boolean> {
  const m = await db.query.member.findFirst({
    where: and(eq(member.userId, userId), eq(member.organizationId, orgId)),
  });
  return !!m;
}