# Chatnode for n8n

A secure, branded, multi-tenant chat frontend and gateway for n8n Chat workflows.
Your n8n webhooks stay server-side; every message is origin-checked, authenticated,
and rate-limited before it reaches your workflow. Manage many bots, gate access
with real auth, and embed a white-label widget anywhere. Chat content is never
stored -- Chatnode keeps only usage stats.

**New here?** See [ARCHITECTURE.md](ARCHITECTURE.md) for a full walkthrough of how the app works.

```
visitor / customer app
        |
        v
  Chatnode gateway   (origin check | auth: session token / user / API key | rate limit)
        |
        v
   per-bot n8n webhook
```

## Quickstart

```bash
cp .env.example .env.local     # fill DATABASE_URL (Postgres), BETTER_AUTH_SECRET
npm install
npm run db:push                # create the Postgres schema
npm run seed                   # optional: demo org + "demo" bot for the landing page
npm run dev                    # http://localhost:3000
```

Sign up at `/signup` -> a workspace (organization) is created automatically ->
create bots, view analytics, manage team + API keys in the dashboard.

## What's included

**V1 - gateway + widget**
- Branded chat widget (`/widget/<botId>`) + one-tag embed loader (`/embed.js`)
- Secure proxy: hidden webhook, HMAC bot-bound session tokens, per-session/per-IP
  token-bucket rate limiting, per-bot origin allowlist, CORS, security headers
- Trusted client-IP resolution (`TRUST_PROXY_HOPS`) so a spoofed `X-Forwarded-For`
  can't dodge rate limits
- Streaming replies: the gateway streams n8n's response to the widget token-by-token (NDJSON/SSE), falling back to single delivery for non-streaming workflows

**V2 - SaaS**
- Auth: email/password + optional Google SSO (better-auth), signed sessions
- Multiple bots per workspace, each with its own webhook, branding, and limits
- No message content stored: only session metadata (ip, geo, browser, and lead details in lead mode), never chat text
- Analytics: sessions, messages, top browsers/countries, per-bot; a live Sessions view (active/expired, location, device, lead details)
- Access modes: anonymous chat, or lead capture (name/email/phone/message) forwarded to n8n as chat_started

**Widget parity (matches n8nchatui.com)**
- Markdown/HTML rendering in replies (XSS-sanitized), RTL layout, consent screen, custom CSS, file upload (per-bot type/size limits)
- Message-credit billing (1 credit = 1 message, packages, ledger; Stripe-ready)
- Analytics page (sessions, 14-day chart, browsers/countries, per-bot), Security page (IP bans), in-app Docs, profile rename, account deletion
- MCP server at `/api/mcp` so Claude/Cursor can manage bots via a workspace API key

**V3 - agency / enterprise**
- Organizations = teams; member management and invites
- White-label: brand name, custom domain field, hide "Protected by Chatnode"
- Org-scoped API keys for server-to-server chat (`X-API-Key`)

## Embedding

```html
<script src="https://your-host/embed.js" data-bot="BOT_ID" data-color="#10b981" defer></script>
```

The loader mints an origin-validated session in the parent page (so the bot's
domain allowlist is enforced), then hands the token to the widget iframe.

## Programmatic API

```bash
curl -X POST https://your-host/api/chat/BOT_ID \
  -H "X-API-Key: sk_..." -H "Content-Type: application/json" \
  -d '{"message":"hello","sessionId":"crm-42"}'
```

Keys are org-scoped and can only reach bots in the same organization.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Neon pooled URL in cloud; any Postgres locally. |
| `BETTER_AUTH_SECRET` | yes | >= 32 chars; signs auth sessions (also fallback for chat tokens). |
| `BETTER_AUTH_URL` | prod | App base URL. |
| `SESSION_SECRET` | no | Separate HMAC key for chat session tokens (defaults to `BETTER_AUTH_SECRET`). |
| `TRUST_PROXY_HOPS` | recommended | Trusted proxies in front of the app; client IP read this many hops from the right of `X-Forwarded-For` (default 1; 0 = directly exposed). |
| `ALLOWED_ORIGINS` | no | Global extra origins allowed to call the API (per-bot allowlists are set in the dashboard). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Enables "Continue with Google" SSO. |
| `N8N_WEBHOOK_URL` | no | Only used by `npm run seed` for the demo bot. |

## Enable Google login

1. Go to https://console.cloud.google.com/apis/credentials -> **Create credentials -> OAuth client ID -> Web application**.
2. Under **Authorized redirect URIs**, add: `<BETTER_AUTH_URL>/api/auth/callback/google`
   (local dev: `http://localhost:3000/api/auth/callback/google`; add your prod URL too).
3. Copy the Client ID and Client secret into `.env.local`:
   ```
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxx
   ```
4. Restart the dev server. A "Continue with Google" button appears on login/signup automatically.

Email + Google sign-ins with the same address link to one account (Google verifies the email).

## Security model

- **Per-bot hidden webhook** - the browser talks only to `/api/chat/<botId>`; the n8n URL is a DB field, never sent to the client.
- **Authentication** - three modes on the chat route: org-scoped API key (`X-API-Key`) > signed-in better-auth user > visitor HMAC token bound to one bot. Lead capture bots only mint a visitor token after the contact form is submitted.
- **Multi-tenant isolation** - bots, sessions, IP bans, keys, and members are org-scoped; dashboard reads and every server action check org ownership before touching a row.
- **Rate limiting** - token bucket per session and per IP, per bot, with spoof-resistant IP resolution.
- **IP ban** - org-scoped IP blocklist enforced at the chat gateway before any work; managed on the Security page or from the analytics session list.
- **Origin + CORS** - per-bot domain allowlist; `/widget/*` is frameable, everything else is `X-Frame-Options: DENY`.
- **Input validation** - messages capped at 4000 chars; server actions validated with Zod; upstream calls time out.
- **SSRF protection** - webhook URLs are blocked from targeting loopback/private/link-local/metadata addresses at save time and (DNS-resolved) at fetch time; redirects are not followed.

## Checks

```bash
npm run check   # token signing, rate limiter, IP resolution, env parsing
npm run build
```

## Stack

Next.js 16 (App Router) - better-auth 1.6 - Drizzle ORM + Postgres (Neon) - Zod - Tailwind v4 - ua-parser-js.
In-memory rate limiter (single instance; swap to Upstash Redis for horizontal scale).