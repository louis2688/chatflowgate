"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { invitation, member, organization, user } from "@/lib/db/schema";
import { createBot, deleteBot, updateBot } from "@/lib/bots";
import { createApiKey, revokeApiKey } from "@/lib/apikeys";
import { PACKAGES, addCredits } from "@/lib/credits";
import { addIpBan, removeIpBan } from "@/lib/ipbans";
import { assertHttpUrl } from "@/lib/ssrf";
import { devTopUpAllowed } from "@/lib/config";
import { requireContext } from "@/lib/server-auth";
import { orgUsage } from "@/lib/usage";

function lines(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const botSchema = z.object({
  name: z.string().min(1).max(80),
  webhookUrl: z.string().url(),
  welcome: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  webhookAuthType: z.enum(["none", "basic", "header"]).catch("none"),
  webhookAuthHeader: z.string().max(100).optional(),
  webhookAuthValue: z.string().max(500).optional(),
  ratePerSession: z.coerce.number().int().min(1).max(1000),
  ratePerIp: z.coerce.number().int().min(1).max(5000),
  consentText: z.string().max(1000).optional(),
  customCss: z.string().max(10000).optional(),
  maxFileSizeMb: z.coerce.number().int().min(1).max(10),
  geoMode: z.enum(["off", "allow", "block"]).catch("off"),
  widgetWidth: z.coerce.number().int().min(280).max(600).catch(400),
  widgetHeight: z.coerce.number().int().min(320).max(900).catch(640),
  widgetType: z.enum(["popup", "inline"]).catch("popup"),
  position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).catch("bottom-right"),
  buttonText: z.string().max(40).optional(),
  greeting: z.string().max(500).optional(),
});

function botValues(formData: FormData, p: z.infer<typeof botSchema>) {
  assertHttpUrl(p.webhookUrl); // SSRF: reject internal/loopback/metadata targets
  return {
    name: p.name,
    webhookUrl: p.webhookUrl,
    welcome: p.welcome || undefined,
    color: p.color || undefined,
    logoUrl: p.logoUrl || null,
    webhookAuthType: p.webhookAuthType,
    webhookAuthHeader: p.webhookAuthType === "none" ? null : p.webhookAuthHeader || null,
    webhookAuthValue: p.webhookAuthType === "none" ? null : p.webhookAuthValue || null,
    allowAnonymous: formData.get("allowAnonymous") === "on",
    leadName: true, // Dave: name + email always collected in lead mode
    leadEmail: true,
    leadPhone: formData.get("leadPhone") === "on",
    leadMessage: formData.get("leadMessage") === "on",
    suggestedPrompts: lines(formData.get("suggestedPrompts")),
    allowedOrigins: lines(formData.get("allowedOrigins")),
    geoMode: p.geoMode,
    // Normalise to ISO 3166-1 alpha-2; anything else is dropped rather than
    // stored, so a typo cannot silently widen or narrow the fence.
    geoCountries: lines(formData.get("geoCountries"))
      .map((c) => c.toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c)),
    ratePerSession: p.ratePerSession,
    ratePerIp: p.ratePerIp,
    rtl: formData.get("rtl") === "on",
    consentRequired: formData.get("consentRequired") === "on",
    consentText: p.consentText || null,
    customCss: p.customCss || null,
    widgetType: p.widgetType,
    position: p.position,
    buttonText: p.buttonText || "Chat with us",
    widgetWidth: p.widgetWidth,
    widgetHeight: p.widgetHeight,
    greeting: p.greeting || null,
    allowFileUpload: formData.get("allowFileUpload") === "on",
    maxFileSizeMb: p.maxFileSizeMb,
    allowedFileTypes: lines(formData.get("allowedFileTypes")),
  };
}

export type ActionResult = { ok: boolean; message: string };

// redirect() and notFound() signal themselves by throwing; those must reach
// Next rather than being reported to the user as a failure.
function isControlFlow(e: unknown): boolean {
  const digest = (e as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND");
}

// Turns an expected failure into a message the UI can toast, instead of an
// unhandled throw that renders Next's error page.
async function run(fn: () => Promise<string>): Promise<ActionResult> {
  try {
    return { ok: true, message: await fn() };
  } catch (e) {
    if (isControlFlow(e)) throw e;
    if (e instanceof z.ZodError) {
      const first = e.issues[0];
      const field = first?.path?.join(".");
      return { ok: false, message: field ? `${field}: ${first.message}` : "Please check the form and try again." };
    }
    console.error("[action]", e);
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createBotAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
  const { orgId } = await requireContext();
  const usage = await orgUsage(orgId);
  if (usage.bots >= usage.plan.maxBots) {
    throw new Error(`Your ${usage.plan.label} plan allows ${usage.plan.maxBots} bot${usage.plan.maxBots === 1 ? "" : "s"}. Upgrade to add more.`);
  }
  const p = botSchema.parse(Object.fromEntries(formData));
  const row = await createBot(orgId, botValues(formData, p));
  redirect(`/bots/${row.id}`);
  });
}

export async function updateBotAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { orgId } = await requireContext();
    const id = String(formData.get("botId"));
    const p = botSchema.parse(Object.fromEntries(formData));
    await updateBot(orgId, id, botValues(formData, p));
    revalidatePath(`/bots/${id}`);
    revalidatePath("/bots");
    return "Bot saved.";
  });
}

export async function deleteBotAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { orgId } = await requireContext();
    await deleteBot(orgId, String(formData.get("botId")));
    redirect("/bots");
    return "Bot deleted.";
  });
}

export async function createApiKeyAction(
  _prev: (ActionResult & { plain?: string }) | null,
  formData: FormData,
): Promise<ActionResult & { plain?: string }> {
  try {
    const { orgId } = await requireContext();
    const name = String(formData.get("name") || "API key").slice(0, 80);
    const { plain } = await createApiKey(orgId, name);
    revalidatePath("/settings");
    return { ok: true, message: `Key "${name}" created. Copy it now.`, plain };
  } catch (e) {
    if (isControlFlow(e)) throw e;
    console.error("[action] createApiKey", e);
    return { ok: false, message: e instanceof Error ? e.message : "Could not create the key." };
  }
}

export async function revokeApiKeyAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { orgId } = await requireContext();
    await revokeApiKey(orgId, String(formData.get("keyId")));
    revalidatePath("/settings");
    return "API key revoked.";
  });
}

export async function updateOrgAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
  const { orgId, role } = await requireContext();
  if (role !== "owner" && role !== "admin") throw new Error("Not authorized");
  const { plan } = await orgUsage(orgId);
  const brandName = String(formData.get("brandName") || "").slice(0, 80);
  const customDomain = String(formData.get("customDomain") || "").slice(0, 200);
  await db
    .update(organization)
    .set({ brandName: brandName || null, hideBranding: plan.canHideBranding && formData.get("hideBranding") === "on", customDomain: customDomain || null })
    .where(eq(organization.id, orgId));
  revalidatePath("/settings");
  return "Branding updated.";
  });
}

// Add an existing user, or record a pending invite. Owner/admin only; role is
// restricted to member/admin (no owner grants here); dedupe is scoped to this org.
export async function inviteMemberAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
  const ctx = await requireContext();
  if (ctx.role !== "owner" && ctx.role !== "admin") throw new Error("Not authorized");
  const usage = await orgUsage(ctx.orgId);
  if (usage.seats >= usage.plan.maxMembers) {
    throw new Error(`Your ${usage.plan.label} plan allows ${usage.plan.maxMembers} member${usage.plan.maxMembers === 1 ? "" : "s"}. Upgrade to invite more.`);
  }
  const email = z.string().email().parse(String(formData.get("email")));
  const role = z.enum(["member", "admin"]).catch("member").parse(String(formData.get("role")));

  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) {
    const already = await db.query.member.findFirst({
      where: and(eq(member.userId, existing.id), eq(member.organizationId, ctx.orgId)),
    });
    if (!already) {
      await db.insert(member).values({ id: crypto.randomUUID(), organizationId: ctx.orgId, userId: existing.id, role });
    }
  } else {
    await db.insert(invitation).values({
      id: crypto.randomUUID(),
      organizationId: ctx.orgId,
      email,
      role,
      inviterId: ctx.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }
  revalidatePath("/settings");
  return existing ? `${email} added to the workspace.` : `Invite recorded for ${email}.`;
  });
}

// ponytail: dev top-up. With STRIPE_SECRET_KEY set, create a Checkout session and
// redirect here instead, fulfilling via webhook. Not wired without keys.
export async function purchaseCreditsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
  const { orgId } = await requireContext();
  // Server-side gate. Hiding the button is not enough: this is a POST endpoint
  // any signed-in user can call directly.
  if (!devTopUpAllowed()) throw new Error("Purchases are not available yet.");
  const { plan } = await orgUsage(orgId);
  if (plan.id === "free") throw new Error("Top-up credits are available on paid plans. Upgrade to buy extra messages.");
  const pkg = PACKAGES.find((p) => p.id === String(formData.get("packageId")));
  if (!pkg) throw new Error("Unknown package");
  await addCredits(orgId, pkg.credits, `purchase:${pkg.id}`);
  revalidatePath("/billing");
  return `${pkg.credits.toLocaleString()} credits added.`;
  });
}

export async function banIpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { orgId } = await requireContext();
    const ip = String(formData.get("ip") || "").trim().slice(0, 64);
    const reason = String(formData.get("reason") || "").slice(0, 200);
    if (!ip) throw new Error("Enter an IP address to ban.");
    await addIpBan(orgId, ip, reason);
    revalidatePath("/security");
    revalidatePath("/analytics");
    return `${ip} banned.`;
  });
}

export async function unbanIpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { orgId } = await requireContext();
    await removeIpBan(orgId, String(formData.get("banId")));
    revalidatePath("/security");
    revalidatePath("/analytics");
    return "IP unbanned.";
  });
}
