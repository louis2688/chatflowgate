import { NextRequest, NextResponse } from "next/server";
import { clientIp, clientGeo, corsHeaders, originAllowed } from "@/lib/config";
import { rateLimit } from "@/lib/ratelimit";
import { verifySession } from "@/lib/token";
import { getBot, isOrgMember } from "@/lib/bots";
import { validateApiKey } from "@/lib/apikeys";
import { recordSession } from "@/lib/store";
import { isIpBanned } from "@/lib/ipbans";
import { geoAllowed } from "@/lib/geo";
import { assertPublicHost, safeFetch } from "@/lib/ssrf";
import { consumeMessage, refundMessage } from "@/lib/credits";
import { webhookAuthHeaders } from "@/lib/webhook-auth";
import { parseDelta } from "@/lib/stream";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 4000;
const FALLBACK = "Sorry, I couldn't generate a response. Please try again.";
type Params = { params: Promise<{ botId: string }> };

export async function OPTIONS(req: NextRequest, { params }: Params) {
  const bot = await getBot((await params).botId);
  return new NextResponse(null, { status: 204, headers: corsHeaders(req, bot?.allowedOrigins ?? []) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const bot = await getBot((await params).botId);
  if (!bot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const cors = corsHeaders(req, bot.allowedOrigins ?? []);
  const bad = (error: string, status: number, extra: Record<string, string> = {}) =>
    NextResponse.json({ error }, { status, headers: { ...cors, ...extra } });

  // Security: reject banned IPs for this org before doing any work.
  const ip = clientIp(req);
  if (await isIpBanned(bot.organizationId, ip)) return bad("ip_banned", 403);
  const ua = req.headers.get("user-agent");
  const geo = clientGeo(req); // { country, region, city } from Vercel headers
  if (!geoAllowed(bot, geo.country)) return bad("country_not_allowed", 403);
  // Cap the body before it is parsed into memory. base64 inflates ~4/3, so allow
  // the file budget plus slack for the message/JSON. Content-Length may be absent
  // (chunked); the platform body limit backstops that case.
  const maxBytes = bot.allowFileUpload ? Math.ceil(bot.maxFileSizeMb * 1024 * 1024 * 1.4) + 16 * 1024 : 64 * 1024;
  if (Number(req.headers.get("content-length") || 0) > maxBytes) return bad("payload_too_large", 413);

  // Caller identity: API key (server-to-server, org-scoped) > org member (cookie
  // session) > anonymous bot-bound token (public bots only). Private bots are
  // reachable ONLY by members of the owning org.
  let sid: string;
  let userId: string | null = null;

  const apiKeyOrg = await validateApiKey(req.headers.get("x-api-key"));
  if (apiKeyOrg) {
    if (apiKeyOrg !== bot.organizationId) return bad("forbidden", 403);
    const body = await safeBody(req);
    sid = typeof body?.sessionId === "string" && body.sessionId ? `key:${body.sessionId}` : `key:${crypto.randomUUID()}`;
  } else {
    if (!originAllowed(req, bot.allowedOrigins ?? [])) return bad("origin_not_allowed", 403);
    const authed = await auth.api.getSession({ headers: req.headers });
    const member = authed ? await isOrgMember(authed.user.id, bot.organizationId) : false;
    if (authed && member) {
      userId = authed.user.id;
      sid = `user:${userId}`;
    } else {
      // A bot-bound token is the credential for both access modes: lead capture
      // bots only get one issued after the visitor submits their details.
      const header = req.headers.get("authorization") ?? "";
      const token = verifySession(header.startsWith("Bearer ") ? header.slice(7) : null);
      if (!token || token.botId !== bot.id) return bad("invalid_session", 401);
      sid = token.sid;
    }
  }

  for (const [key, limit] of [
    [`chat:ip:${bot.id}:${clientIp(req)}`, bot.ratePerIp],
    [`chat:sid:${bot.id}:${sid}`, bot.ratePerSession],
  ] as const) {
    const rl = await rateLimit(key, limit, 60_000);
    if (!rl.ok) return bad("rate_limited", 429, { "Retry-After": String(rl.retryAfterSec) });
  }

  const body = await safeBody(req);
  const message = body?.message;
  if (typeof message !== "string" || !message.trim() || message.length > MAX_INPUT_CHARS) {
    return bad("bad_request", 400);
  }
  const clean = message.trim();

  // Optional file attachment (base64 data URL). Validated against bot limits,
  // forwarded to n8n under `files`. ponytail: exact n8n file schema may need
  // tweaking against a live instance.
  let filePayload: { name: string; mimeType: string; data: string } | undefined;
  const file = body?.file as { name?: string; type?: string; dataUrl?: string } | undefined;
  if (file && typeof file.dataUrl === "string" && file.dataUrl.startsWith("data:")) {
    if (!bot.allowFileUpload) return bad("bad_request", 400);
    const b64 = file.dataUrl.split(",")[1] ?? "";
    if (Math.floor((b64.length * 3) / 4) > bot.maxFileSizeMb * 1024 * 1024) return bad("file_too_large", 413);
    if (bot.allowedFileTypes.length && file.type && !bot.allowedFileTypes.includes(file.type)) return bad("file_type_not_allowed", 415);
    filePayload = { name: String(file.name || "file").slice(0, 200), mimeType: String(file.type || "application/octet-stream"), data: b64 };
  }

  let target: URL;
  try {
    target = new URL(bot.webhookUrl);
    await assertPublicHost(target); // SSRF guard before any request
  } catch {
    return bad("upstream_error", 502);
  }

  // Billing: 1 credit per user message (charged to the bot's org). Refunded in
  // the stream if the upstream call fails before producing any reply.
  const charge = await consumeMessage(bot.organizationId);
  if (!charge.ok) return bad("out_of_credits", 402);

  const headers: Record<string, string> = { "Content-Type": "application/json", ...webhookAuthHeaders(bot) };

  // Stream the reply to the client as text deltas. Works whether n8n streams
  // (NDJSON / SSE token chunks) or returns a single JSON body (sent as one delta).
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      const push = (s: string) => {
        if (!s) return;
        full += s;
        controller.enqueue(encoder.encode(s));
      };
      try {
        const upstream = await safeFetch(target, {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "sendMessage", sessionId: sid, chatInput: clean, ...(filePayload ? { files: [filePayload] } : {}) }),
          signal: AbortSignal.timeout(120_000),
          redirect: "error",
        });
        if (!upstream.ok || !upstream.body) {
          // Status only, never the response body: enough to diagnose, no PII.
          console.error(`[chat] bot=${bot.id} upstream_status=${upstream.status}`);
          await refundMessage(bot.organizationId, charge.spentCredit).catch(() => {});
          // Only the owning org's members see the real reason; visitors get the
          // generic fallback so bot internals never leak.
          push(userId ? `The n8n webhook returned ${upstream.status}. If this is 404, check the workflow's Active toggle.` : FALLBACK);
        } else {
          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buf.indexOf("\n")) >= 0) {
              push(parseDelta(buf.slice(0, nl)));
              buf = buf.slice(nl + 1);
            }
          }
          push(parseDelta(buf));
        }
      } catch (e) {
        const name = e instanceof Error ? e.name : "unknown";
        console.error(`[chat] bot=${bot.id} upstream_error=${name}`);
        // A partial reply means n8n did run the workflow; only refund when the
        // failure came before any content arrived.
        if (!full) await refundMessage(bot.organizationId, charge.spentCredit).catch(() => {});
        push(userId ? (name === "TimeoutError" ? "The n8n webhook timed out after 120s." : `Could not reach the n8n webhook (${name}).`) : FALLBACK);
      }
      if (!full) {
        console.error(`[chat] bot=${bot.id} upstream_empty=true`);
        push(userId ? "The n8n webhook answered with no extractable reply text - check the workflow's response format." : FALLBACK);
      }
      // Record session metadata only (ip, geo, parsed UA). Never store message text.
      // Skipped when the caller is a signed-in member of the owning org: that is
      // the live-preview path, and logging it would put the operator's own IP
      // and a never-rotating session into their visitor analytics.
      if (!userId) await recordSession(bot.id, sid, { ip, ua, ...geo }).catch(() => {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

async function safeBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  const anyReq = req as unknown as { _cachedBody?: Record<string, unknown> | null };
  if (anyReq._cachedBody !== undefined) return anyReq._cachedBody;
  try {
    anyReq._cachedBody = (await req.json()) as Record<string, unknown>;
  } catch {
    anyReq._cachedBody = null;
  }
  return anyReq._cachedBody;
}