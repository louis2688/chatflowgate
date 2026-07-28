import Link from "next/link";

export const metadata = { title: "Docs - Chatnode" };
export const dynamic = "force-dynamic";

const NAV: Array<[string, string]> = [
  ["quickstart", "Quickstart"],
  ["access", "Access modes"],
  ["backend-integration", "Backend integration"],
  ["widget-api", "Chat widget API"],
  ["session-management", "Session management"],
  ["streaming", "Chat streaming"],
  ["markdown", "Markdown and HTML"],
  ["file-uploads", "File uploads"],
  ["media", "Media attachments"],
  ["custom-css", "Custom CSS"],
  ["rtl", "RTL layout"],
  ["metadata", "Metadata"],
  ["event-callbacks", "Event callbacks"],
  ["voice-input", "Voice input"],
  ["mcp", "MCP server"],
  ["api", "Programmatic API"],
  ["geofencing", "Geofencing"],
  ["security", "Security and limits"],
];

const card = "scroll-mt-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/40";
const h2 = "font-display text-lg font-semibold text-neutral-900 dark:text-white";
const p = "mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400";
const strong = "font-medium text-neutral-900 dark:text-neutral-200";
const link = "text-emerald-400 hover:underline";
const code = "rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:bg-black/40 dark:text-emerald-300";
const pre = "mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-neutral-800 dark:border-white/10 dark:bg-black/40 dark:text-emerald-300";

function Soon() {
  return (
    <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
      Not supported yet
    </span>
  );
}

function Section({ id, title, soon, children }: { id: string; title: string; soon?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={card}>
      <h2 className={h2}>
        {title}
        {soon && <Soon />}
      </h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    // Its own reading width: the shell is sized for the bot editor, and prose
    // set to 1600px is a miserable line length.
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Documentation</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Chatnode is a secure interface and router in front of your n8n Chat workflows. n8n stays the brain; Chatnode handles the
          widget, authentication, rate limiting, and analytics. Chat message content is never stored.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-500">On this page</p>
            <ul className="space-y-1.5 border-l border-neutral-200 dark:border-neutral-800">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="-ml-px block border-l border-transparent pl-3 text-sm text-neutral-600 transition-colors hover:border-emerald-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <Section id="quickstart" title="Quickstart">
            <p className={p}>
              Create a bot in <Link href="/bots" className={link}>Bots</Link> and point it at your n8n{" "}
              <span className={strong}>Chat Trigger</span> webhook URL. That URL is stored server-side and is never sent to the browser.
              Choose <span className={strong}>Allow anonymous</span> (visitors chat straight away) or leave it off to
              <span className={strong}> capture a lead</span> first. Then drop one tag on your site:
            </p>
            <pre className={pre}>
              <code>{`<script src="https://www.chatnode.app/embed.js" data-bot="BOT_ID" defer></script>`}</code>
            </pre>
            <p className={p}>Add the domains that may use the bot to its origin allowlist. Anything not listed is refused a session.</p>
          </Section>

          <Section id="access" title="Access modes">
            <p className={p}>
              <span className={strong}>Allow anonymous</span> on: the visitor opens the widget and chats immediately. This is how most
              site widgets run.
            </p>
            <p className={p}>
              <span className={strong}>Allow anonymous</span> off: a short form appears first. Pick which of name, email, phone and message
              are collected. Nothing reaches your workflow until it is filled in, and the details arrive as their own event:
            </p>
            <pre className={pre}>
              <code>{`{
  "action": "chatStarted",
  "event": "chat_started",
  "sessionId": "3f9c...",
  "visitor": { "name": "Sarah", "email": "sarah@acme.com", "phone": null },
  "message": "I want a demo"
}`}</code>
            </pre>
            <p className={p}>
              The gate is enforced when the session is minted, not in the widget, so posting straight at the API without the details gets
              a <span className={code}>400</span> and no token. If a message was collected it is also sent as the first chat turn, so the
              visitor gets a reply to what they already typed.
            </p>
          </Section>

          <Section id="backend-integration" title="Backend integration">
            <p className={p}>For every user message, Chatnode POSTs JSON to your bot webhook:</p>
            <pre className={pre}>
              <code>{`POST <your n8n Chat Trigger webhook>
Content-Type: application/json

{
  "action": "sendMessage",
  "sessionId": "3f9c...",        // stable per conversation
  "chatInput": "the user message",
  "files": [                      // only when a file is attached
    { "name": "invoice.pdf", "mimeType": "application/pdf", "data": "<base64>" }
  ]
}`}</code>
            </pre>
            <p className={p}>
              Under <span className={strong}>Webhook authentication</span> you can match whatever your n8n Chat Trigger expects:
              <span className={strong}> None</span>, <span className={strong}>Basic Auth</span> (username and password, base64-encoded into
              an <span className={code}>Authorization: Basic</span> header for you), or a <span className={strong}>custom header</span> (an
              API key or bearer token). The credential is stored server-side and sent only to the webhook, never to the browser. Upstream
              calls time out after 120 seconds and redirects are never followed. Webhook hosts that
              resolve to loopback, private, link-local, or cloud metadata addresses are rejected both when you save the bot and again at
              request time.
            </p>
            <p className={p}>
              Reply with either a single JSON body or a stream. Chatnode reads the first text field it finds among{" "}
              <span className={code}>content</span>, <span className={code}>delta</span>, <span className={code}>output</span>,{" "}
              <span className={code}>text</span>, <span className={code}>message</span>, <span className={code}>reply</span>.
            </p>
          </Section>

          <Section id="widget-api" title="Chat widget API">
            <p className={p}>The loader is configured with data attributes on the script tag:</p>
            <pre className={pre}>
              <code>{`<script src="https://www.chatnode.app/embed.js"
        data-bot="BOT_ID"          // required
        data-color="#1c69d4"       // launcher colour
        data-position="left"       // "left" or "right" (default)
        defer></script>`}</code>
            </pre>
            <p className={p}>
              The launcher mounts a button and a lazy iframe: the widget is only fetched the first time it is opened. You can also embed
              the widget directly at <span className={code}>/widget/&lt;botId&gt;</span> in your own iframe, optionally passing a session
              token as <span className={code}>#t=&lt;token&gt;</span>.
            </p>
            <p className={p}>
              Appearance and behaviour come from the bot record, not from the page: name, welcome message, colour, logo, suggested
              prompts, RTL, consent screen, and the file-upload rules. There is currently no JavaScript API for opening or closing the
              widget programmatically.
            </p>
          </Section>

          <Section id="session-management" title="Session management">
            <p className={p}>
              Anonymous visitors get a short-lived session token bound to a single bot. The loader mints it from the <em>parent</em> page,
              so the browser sends your real origin and Chatnode can check it against the bot allowlist before issuing anything:
            </p>
            <pre className={pre}>
              <code>{`POST /api/session/<botId>   ->   { "token": "..." }`}</code>
            </pre>
            <p className={p}>
              Tokens are HMAC-signed, valid for 24 hours, and only accepted by the bot they were minted for. The widget keeps the token in{" "}
              <span className={code}>sessionStorage</span> under <span className={code}>chatnode.token.&lt;botId&gt;</span>, falling back
              to memory when storage is blocked. Minting is rate limited to 10 per minute per IP per bot.
            </p>
            <p className={p}>
              The <span className={code}>sessionId</span> sent to n8n is what ties a conversation together, so use it as the memory key in
              your workflow. Signed-in dashboard users chat as <span className={code}>user:&lt;id&gt;</span>; server-to-server callers
              control it themselves by passing <span className={code}>sessionId</span> in the request body. Lead capture bots issue no
              token until the visitor submits their details, so the token doubles as proof the form was completed.
            </p>
          </Section>

          <Section id="streaming" title="Chat streaming">
            <p className={p}>
              Replies stream to the widget as <span className={code}>text/plain</span> deltas and the bubble grows token by token. On the
              upstream side Chatnode parses each line and accepts several shapes, so most n8n setups work unchanged:
            </p>
            <pre className={pre}>
              <code>{`{"content":"Hel"}              // NDJSON token objects
data: {"content":"lo"}         // SSE frames
{"output":"a full reply"}      // single JSON body
plain text                     // raw token`}</code>
            </pre>
            <p className={p}>
              Control frames with no text field and <span className={code}>[DONE]</span> markers are ignored. Workflows that do not stream
              are delivered as one chunk, so nothing needs configuring either way. If the upstream call fails or returns nothing, the
              widget shows a fallback message rather than an empty bubble.
            </p>
          </Section>

          <Section id="markdown" title="Markdown and HTML">
            <p className={p}>
              Bot replies are rendered as markdown and then sanitized before they touch the DOM. Headings, bold and italic, ordered and
              unordered lists, links, inline code, code blocks, blockquotes, tables, and images all render. Scripts, event handlers, and
              other active content are stripped, so a workflow that echoes untrusted text cannot inject script into the host page.
            </p>
            <p className={p}>Messages typed by the user are always treated as plain text.</p>
          </Section>

          <Section id="file-uploads" title="File uploads">
            <p className={p}>
              Enable uploads per bot and set a maximum size and a list of accepted MIME types. The visitor can attach one file per message;
              it is base64 encoded and forwarded to your workflow in the <span className={code}>files</span> array shown in{" "}
              <a href="#backend-integration" className={link}>Backend integration</a>.
            </p>
            <p className={p}>
              The limits are enforced on the server as well as in the browser: oversized files are rejected with{" "}
              <span className={code}>413</span> and disallowed types with <span className={code}>415</span>, so the restrictions hold even
              if someone calls the API directly.
            </p>
          </Section>

          <Section id="media" title="Media attachments">
            <p className={p}>
              Outbound media is the file upload above. For media coming back from your workflow, return a markdown image and it renders in
              the reply, sanitized like the rest of the markdown:
            </p>
            <pre className={pre}>
              <code>{`![Delivery route](https://cdn.example.com/route.png)`}</code>
            </pre>
            <p className={p}>Links to other file types render as ordinary links. There is no dedicated carousel, gallery, or card component yet.</p>
          </Section>

          <Section id="custom-css" title="Custom CSS">
            <p className={p}>
              Each bot can carry its own stylesheet, injected into the widget so you can match a customer brand without forking anything.
              It applies to the widget only and never to the dashboard. Closing style sequences are stripped from the value, so custom CSS
              cannot break out of its style block.
            </p>
            <pre className={pre}>
              <code>{`.md-body a { color: #0b57d0; text-decoration: none; }
.md-body code { background: rgba(0,0,0,.06); }
.chat-scroll { scrollbar-width: none; }`}</code>
            </pre>
          </Section>

          <Section id="rtl" title="RTL layout">
            <p className={p}>
              Turn on RTL for a bot and the widget flips to right-to-left: message alignment, the composer, and the attachment controls all
              mirror. Use it for Arabic, Hebrew, Farsi, and Urdu deployments. It is per bot, so one workspace can serve both directions.
            </p>
          </Section>

          <Section id="metadata" title="Metadata" soon>
            <p className={p}>
              The webhook payload is currently fixed to <span className={code}>action</span>, <span className={code}>sessionId</span>,{" "}
              <span className={code}>chatInput</span>, and <span className={code}>files</span>. Arbitrary key/value metadata from the host
              page is not forwarded yet.
            </p>
            <p className={p}>
              Until it lands there are two workarounds: set the bot credential header to a static value your workflow can branch on, or
              encode context into the <span className={code}>sessionId</span> when you call the API server to server, for example{" "}
              <span className={code}>crm-42:plan-pro</span>.
            </p>
          </Section>

          <Section id="event-callbacks" title="Event callbacks" soon>
            <p className={p}>
              The loader does not emit lifecycle events and exposes no global object, so there is nothing to subscribe to for opened,
              closed, message sent, or message received. The widget also posts no messages to the parent page. If you need analytics today,
              the dashboard already records sessions, message counts, browsers, and countries without any page instrumentation.
            </p>
          </Section>

          <Section id="voice-input" title="Voice input" soon>
            <p className={p}>
              There is no microphone capture or speech to text in the widget. Visitors type. If you need voice, transcribe upstream and
              call the chat API with the resulting text.
            </p>
          </Section>

          <Section id="mcp" title="MCP server">
            <p className={p}>
              Chatnode speaks the Model Context Protocol over HTTP, so Claude or Cursor can manage a workspace directly. Authenticate with
              a workspace API key from <Link href="/settings" className={link}>Settings</Link>:
            </p>
            <pre className={pre}>
              <code>{`{
  "mcpServers": {
    "chatnode": {
      "url": "https://www.chatnode.app/api/mcp",
      "headers": { "Authorization": "Bearer sk_..." }
    }
  }
}`}</code>
            </pre>
            <p className={p}>
              Tools: <span className={code}>list_bots</span>, <span className={code}>create_bot</span>,{" "}
              <span className={code}>update_bot</span>, <span className={code}>get_analytics</span>. Every call is scoped to the workspace
              that owns the key, and webhook URLs created this way go through the same SSRF checks as the dashboard.
            </p>
          </Section>

          <Section id="api" title="Programmatic API">
            <p className={p}>
              For server-to-server use, create an API key in <Link href="/settings" className={link}>Settings</Link> and call the bot
              directly:
            </p>
            <pre className={pre}>
              <code>{`curl -X POST https://www.chatnode.app/api/chat/BOT_ID \\
  -H "X-API-Key: sk_..." -H "Content-Type: application/json" \\
  -d '{"message":"hello","sessionId":"crm-42"}'`}</code>
            </pre>
            <p className={p}>
              The response streams as <span className={code}>text/plain</span>. Keys are workspace scoped and can only reach bots in the
              same workspace. Because you supply the <span className={code}>sessionId</span>, you decide what counts as one conversation.
            </p>
          </Section>

          <Section id="geofencing" title="Geofencing">
            <p className={p}>
              Restrict a bot by country. Pick <span className={strong}>Allow only these countries</span> to serve a fixed set of markets,
              or <span className={strong}>Block these countries</span> to keep specific ones out. Enter two-letter country codes
              (<span className={code}>PH</span>, <span className={code}>US</span>, <span className={code}>SG</span>), one per line.
            </p>
            <p className={p}>
              The check runs before a session token is issued, so a fenced-out visitor never gets one, and again on every message, so a
              token minted elsewhere cannot be reused from a blocked country. Visitors we cannot place are refused under an allowlist
              (fail closed) and admitted under a blocklist, since absence of a location is not evidence of a blocked one.
            </p>
          </Section>

          <Section id="security" title="Security and limits">
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              <li>&bull; <span className={strong}>Hidden webhook</span> - the n8n URL is a server-side field, never sent to the browser.</li>
              <li>&bull; <span className={strong}>Three caller modes</span> - workspace API key, signed-in member, or a visitor token bound to one bot.</li>
              <li>&bull; <span className={strong}>Rate limiting</span> - token buckets per session and per IP, tuned per bot, with spoof-resistant client IP resolution.</li>
              <li>&bull; <span className={strong}>Geofencing</span> - per-bot country allowlist or blocklist, enforced at session issue and on every message.</li>
              <li>&bull; <span className={strong}>IP bans</span> - blocked addresses are refused at the gateway before any work happens.</li>
              <li>&bull; <span className={strong}>Origin allowlist</span> - only the domains you list can obtain a session.</li>
              <li>&bull; <span className={strong}>Input caps</span> - messages are limited to 4000 characters.</li>
              <li>&bull; <span className={strong}>Credits</span> - one credit per user message; the API returns <span className={code}>402</span> when a workspace runs out.</li>
              <li>&bull; <span className={strong}>No message content</span> - only per-session metadata is kept (ip, geo, device, and lead details in lead mode). Message text is never written to the database.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}