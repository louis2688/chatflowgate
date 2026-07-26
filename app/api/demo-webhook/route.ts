import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stand-in for a customer's n8n Chat Trigger, used only by the landing-page demo
// bot. It speaks the same contract n8n does (accepts { chatInput }, streams
// NDJSON {"content": "..."} chunks) so the demo exercises the real gateway path
// -- session token, origin check, rate limit, credit, SSRF guard -- instead of
// bypassing it. Not an LLM: canned answers, matched on keywords.

// Built from lib/plans.ts rather than written out, because this string is the
// only public pricing statement in the product (the landing page demo bot) and
// it silently went stale the last time prices moved.
function pricingLine(): string {
  const all = Object.values(PLANS);
  const free = PLANS.free;
  const paid = all.filter((p) => p.price > 0);
  const seats = (n: number) => `${n} seat${n === 1 ? "" : "s"}`;
  const bots = (n: number) => `${n} bot${n === 1 ? "" : "s"}`;
  const parts = paid.map(
    (p) => `${p.label} is $${p.price}/month for ${seats(p.maxMembers)}, ${bots(p.maxBots)} and ${p.monthlyMessages.toLocaleString()} messages`,
  );
  return (
    `Chatnode has ${all.length} plans. Free gives you ${bots(free.maxBots)} and ${free.monthlyMessages.toLocaleString()} messages a month. ` +
    `${parts.join(". ")}. Every paid plan removes the Chatnode badge, and top-up credits never expire.`
  );
}

type Reply = { match: RegExp; text: string };

const REPLIES: Reply[] = [
  {
    match: /pric|cost|plan|how much|subscri/i,
    text: pricingLine(),
  },
  {
    match: /secur|safe|protect|ssrf|rate.?limit|abuse|ban/i,
    text: "Security is the point of Chatnode. Your n8n webhook URL never reaches the browser, so nobody can scrape or hammer it directly. On top of that: per-session and per-IP rate limiting that resists spoofed headers, an IP ban list, a per-bot domain allowlist, and SSRF protection that re-checks the resolved address at connection time to block DNS rebinding.",
  },
  {
    match: /privacy|store|storage|gdpr|complian|data|log/i,
    text: "We never store your chat message content. Nothing is written to the database, so there is nothing to leak or be compelled to hand over. We keep only session metadata for your analytics: a session id, approximate location, browser and device, and a message count.",
  },
  {
    match: /n8n|webhook|workflow|connect|integrat/i,
    text: "Point a bot at your n8n Chat Trigger webhook URL and Chatnode does the rest. Every message is authenticated, rate limited and metered before it reaches your workflow, and the reply streams straight back to the visitor. Your n8n stays the brain; Chatnode is the secure interface in front of it.",
  },
  {
    match: /embed|install|add to|script|website|start|setup|set up/i,
    text: "One script tag. Add <script src=\"https://www.chatnode.app/embed.js\" data-bot=\"YOUR_BOT_ID\" defer></script> to any page on a domain you have allowlisted, and the widget appears. You can also embed it directly as an iframe if you prefer.",
  },
  {
    match: /team|seat|member|invite|agency|client/i,
    text: "Chatnode is built for teams. A workspace can have several members, each with a role, and you can run many bots from one account, each pointing at a different n8n workflow. That makes it a good fit for agencies running chatbots for multiple clients.",
  },
  {
    match: /lead|capture|email|form|contact/i,
    text: "You can switch a bot from anonymous chat to lead capture. The visitor fills in their name and email first (phone and message optional), and those details are sent to your n8n workflow as a chat_started event before the conversation begins.",
  },
  {
    match: /stream|markdown|file|upload|rtl|custom css|dark/i,
    text: "The widget streams replies token by token, renders markdown safely, supports file uploads with per-bot type and size limits, right-to-left layouts, a consent screen, custom CSS, and light or dark themes.",
  },
  {
    match: /who|what (is|are) (you|this|chatnode)|about|hello|hi\b|hey/i,
    text: "Hi! I'm the Chatnode demo assistant. Chatnode is a secure, branded chat front end for n8n workflows: it hides your webhook, blocks abuse, and gives you a widget you can drop on any site with one script tag. Ask me about pricing, security, or how it connects to n8n.",
  },
];

const FALLBACK =
  "I'm a small demo assistant, so I only know about Chatnode itself. Try asking about pricing, security, how it connects to n8n, or how to embed the widget. In your own bot this would be your n8n workflow answering, with whatever model and data you wire up.";

function replyFor(input: string): string {
  const found = REPLIES.find((r) => r.match.test(input));
  return found ? found.text : FALLBACK;
}

export async function POST(req: NextRequest) {
  let body: { chatInput?: unknown } | null = null;
  try {
    body = (await req.json()) as { chatInput?: unknown };
  } catch {
    body = null;
  }
  const input = typeof body?.chatInput === "string" ? body.chatInput : "";
  const text = replyFor(input);

  // Stream in small chunks, the way a streaming n8n workflow would, so the demo
  // also shows off the widget's token-by-token rendering.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const words = text.split(" ");
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
        controller.enqueue(encoder.encode(JSON.stringify({ content: chunk }) + "\n"));
        await new Promise((r) => setTimeout(r, 40));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function GET() {
  return NextResponse.json({ ok: true, note: "Demo webhook for the landing-page bot. POST { chatInput } to it." });
}