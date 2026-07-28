import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { corsHeaders, originAllowed, clientIp, clientGeo } from "@/lib/config";
import { rateLimit } from "@/lib/ratelimit";
import { issueSession, verifySession } from "@/lib/token";
import { getBot, type Bot } from "@/lib/bots";
import { assertPublicHost, safeFetch } from "@/lib/ssrf";
import { webhookAuthHeaders } from "@/lib/webhook-auth";
import { geoAllowed } from "@/lib/geo";
import { recordLeadSession } from "@/lib/store";
import { auth } from "@/lib/auth";
import { isOrgMember } from "@/lib/bots";
import { trapTripped } from "@/lib/honeypot";

export const runtime = "nodejs";

type Params = { params: Promise<{ botId: string }> };

const leadSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(2000).optional(),
});
type Lead = z.infer<typeof leadSchema>;

export async function OPTIONS(req: NextRequest, { params }: Params) {
  const bot = await getBot((await params).botId);
  return new NextResponse(null, { status: 204, headers: corsHeaders(req, bot?.allowedOrigins ?? []) });
}

// Tell the workflow a qualified visitor arrived. Best effort: if n8n is down the
// visitor still gets to chat, we just could not hand over the lead.
async function forwardLead(bot: Bot, sessionId: string, lead: Lead) {
  let target: URL;
  try {
    target = new URL(bot.webhookUrl);
    await assertPublicHost(target); // same SSRF guard as the chat route
  } catch {
    return;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json", ...webhookAuthHeaders(bot) };
  await safeFetch(target, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "chatStarted",
      event: "chat_started",
      sessionId,
      visitor: { name: lead.name ?? null, email: lead.email ?? null, phone: lead.phone ?? null },
      message: lead.message ?? null,
    }),
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  }).catch(() => {});
}

// Mints the widget session. Anonymous bots hand one over immediately; lead
// capture bots require the enabled contact fields first, so the token itself is
// the proof that details were collected. Enforced here, not in the widget: the
// form alone would be trivially bypassed by posting straight to this route.
export async function POST(req: NextRequest, { params }: Params) {
  const bot = await getBot((await params).botId);
  if (!bot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const cors = corsHeaders(req, bot.allowedOrigins ?? []);
  const bad = (error: string, status: number, extra: Record<string, unknown> = {}) =>
    NextResponse.json({ error, ...extra }, { status, headers: cors });

  if (!originAllowed(req, bot.allowedOrigins ?? [])) return bad("origin_not_allowed", 403);
  // Refuse before minting a token, so a fenced-out visitor never gets a session.
  if (!geoAllowed(bot, clientGeo(req).country)) return bad("country_not_allowed", 403);

  const rl = await rateLimit(`session:${bot.id}:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...cors, "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (bot.allowAnonymous) return NextResponse.json({ token: issueSession(bot.id) }, { headers: cors });

  const body = await req.json().catch(() => null);
  // Silent success: the bot gets a token-shaped 200 and learns nothing, but no
  // lead is recorded and the workflow is never told a visitor arrived.
  if (trapTripped(body)) return NextResponse.json({ token: issueSession(bot.id) }, { headers: cors });
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return bad("invalid_lead", 400);
  const lead = parsed.data;

  const missing: string[] = [];
  if (bot.leadName && !lead.name) missing.push("name");
  if (bot.leadEmail && !lead.email) missing.push("email");
  if (bot.leadPhone && !lead.phone) missing.push("phone");
  if (bot.leadMessage && !lead.message) missing.push("message");
  if (missing.length) return bad("lead_required", 400, { fields: missing });

  const token = issueSession(bot.id);
  const sid = verifySession(token)?.sid ?? crypto.randomUUID();

  // A signed-in member of the owning org is testing via the live preview, not a
  // real visitor. Issue the token so the chat works, but do not record a fake
  // lead in analytics and do not fire chat_started at the customer's production
  // n8n workflow, which could create a bogus CRM record or notify their sales team.
  // Both guarded: this is preview detection, and a visitor must still be able to
  // start a chat when it fails. Falling back to false treats them as a real
  // visitor, which is the safe side -- the lead gets recorded and forwarded
  // rather than silently dropped. Unguarded, a throw here 500s the request and
  // the widget shows "check your details", which is nothing to do with it.
  const authed = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  const previewing = authed ? await isOrgMember(authed.user.id, bot.organizationId).catch(() => false) : false;
  if (!previewing) {
    await recordLeadSession(bot.id, sid, { ip: clientIp(req), ua: req.headers.get("user-agent"), ...clientGeo(req) }, lead).catch(() => {});
    // Best effort by design: n8n being down must not cost the visitor their chat.
    await forwardLead(bot, sid, lead).catch(() => {});
  }
  return NextResponse.json({ token }, { headers: cors });
}