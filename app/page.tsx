import type { Metadata } from "next";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import Chat from "@/components/Chat";
import { getBot, publicConfig } from "@/lib/bots";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chatnode | Secure, multi-tenant chat frontend and webhook gateway for n8n",
  description:
    "Put a security gateway in front of your n8n Chat workflows: the webhook stays server-side, every message is origin-checked, rate limited and metered, and the widget is white-label. Chat content is never stored.",
  alternates: { canonical: "https://www.chatnode.app/" },
  openGraph: {
    title: "Chatnode | Secure, multi-tenant chat frontend for n8n",
    description:
      "Hidden webhooks, per-IP and per-session rate limiting, signed bot-bound sessions, and white-label widgets for n8n Chat workflows.",
    url: "https://www.chatnode.app/",
    siteName: "Chatnode",
    type: "website",
  },
};

const cta =
  "inline-flex items-center justify-center rounded-[8px] bg-[#1c69d4] px-6 py-3 text-xs font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#0653b6]";
const ctaOutline =
  "inline-flex items-center justify-center rounded-[8px] border border-white/25 px-6 py-3 text-xs font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white";
const h2 = "text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl";
const eyebrow = "text-[11px] font-bold uppercase tracking-[1.5px] text-[#4a90e2]";

// Every claim below has to be true of the shipped code. No compliance badges we
// do not hold, no invented metrics, and pricing comes from lib/plans.ts so the
// page cannot drift from what the billing code actually charges.
const RISKS: Array<[string, string]> = [
  [
    "The webhook is in the page source",
    "n8n's own chat widget puts your production webhook URL in client-side JavaScript. Anyone can open devtools, copy it, and post to your workflow all day from outside your site.",
  ],
  [
    "Nothing stops a bot spending your model budget",
    "A raw trigger has no rate limit. One script can run your workflow thousands of times an hour, and every run bills you for whatever model sits behind it.",
  ],
  [
    "No access control, no tenancy",
    "There is no origin check, no session, and no way to separate one client's bot from another's, which makes handing a chatbot to a customer awkward and risky.",
  ],
];

const FEATURES: Array<[string, string]> = [
  [
    "Hidden webhook",
    "The n8n URL is a server-side database field. The browser only ever talks to your Chatnode endpoint, so the workflow address is never exposed and cannot be scraped.",
  ],
  [
    "Token-bucket rate limiting",
    "Per-session and per-IP buckets, tuned per bot, answering with 429 and Retry-After. The client IP is read from a trusted proxy hop, so a forged X-Forwarded-For cannot mint a fresh quota.",
  ],
  [
    "Signed, bot-bound sessions",
    "Visitors chat with an HMAC-SHA256 token tied to one bot and expiring in 24 hours. It is issued only after the parent page origin is checked against that bot's domain allowlist.",
  ],
  [
    "SSRF protection",
    "Webhook targets are DNS-resolved and refused if they point at loopback, private, link-local, or cloud metadata addresses. Redirects are never followed.",
  ],
  [
    "Abuse controls",
    "Org-scoped IP bans enforced before any work, per-bot country allow and block lists, and hidden spam traps on the widget forms that a real visitor cannot see or tab to.",
  ],
  [
    "Multi-tenant workspaces",
    "Bots, sessions, keys, bans, and members all belong to an organization, and every dashboard read and write is scoped to it. Org-scoped API keys cover server-to-server chat.",
  ],
  [
    "No chat content stored",
    "Message text is never written down. Chatnode keeps one row per session with IP, coarse location, browser, and a message counter, which is what the analytics are built from.",
  ],
  [
    "White-label widget",
    "One script tag. Per-bot colour, logo, greeting, prompts, RTL, consent screen, and custom CSS, with the Chatnode badge removable on any paid plan.",
  ],
];

const FAQ: Array<[string, string]> = [
  [
    "How does Chatnode connect to my n8n workflow?",
    "Paste your n8n Chat Trigger production webhook URL into the bot. Chatnode stores it server-side and forwards each message as a standard sendMessage payload with the session id and chat input, then streams the reply back to the widget.",
  ],
  [
    "Does it work with n8n Cloud and self-hosted n8n?",
    "Both, as long as the instance is reachable over the public internet. A self-hosted n8n on localhost or a private LAN address will be refused on purpose: the SSRF guard blocks loopback, private, link-local, and metadata addresses.",
  ],
  [
    "Does the gateway slow replies down?",
    "It adds one proxied hop. Streaming workflows are passed through as they produce text, so the time to the first word tracks your workflow and model rather than the proxy. Functions run in the same region as the database to keep that hop short.",
  ],
  [
    "Is my chat content stored anywhere?",
    "No. Message text is never persisted. Chatnode records session metadata only: IP address, country, region and city from edge headers, parsed browser, OS and device, and a message count. In lead capture mode it also stores the contact details the visitor submitted.",
  ],
  [
    "What happens when someone abuses a bot?",
    "They hit a 429 with Retry-After before the request reaches n8n. You can also ban an IP for the whole workspace, fence a bot to specific countries, and the hidden spam traps drop automated form and chat posts without spending a message.",
  ],
  [
    "Can I call it from my own backend?",
    "Yes. Create an org-scoped API key and post to the chat endpoint with an X-API-Key header. Keys only reach bots inside the same organization.",
  ],
];

export default async function Home() {
  const bot = await getBot("demo");
  const plans = Object.values(PLANS);
  const paid = plans.filter((p) => p.price > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Chatnode",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Secure, white-label chat frontend and webhook gateway for n8n Chat workflows, with hidden webhooks, rate limiting, signed sessions, and multi-tenant workspaces.",
        url: "https://www.chatnode.app/",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: String(Math.min(...plans.map((p) => p.price))),
          highPrice: String(Math.max(...plans.map((p) => p.price))),
          offerCount: String(plans.length),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="m-stripe" />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-[#1c69d4]/25 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-40 h-[420px] w-[520px] rounded-full bg-[#0653b6]/20 blur-[130px]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo onDark priority className="h-11 w-auto" />
        <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[1.5px]">
          <Link href="#pricing" className="hidden text-neutral-300 transition-colors hover:text-white sm:inline">Pricing</Link>
          <Link href="/login" className="text-neutral-300 transition-colors hover:text-white">Log in</Link>
          <Link href="/signup" className={cta.replace("px-6 py-3", "px-5 py-2.5")}>Start free</Link>
        </div>
      </nav>

      {/* 1. Hero */}
      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-200">
            <svg className="h-3 w-3 text-[#1c69d4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" strokeLinejoin="round" />
            </svg>
            Chatnode &middot; for n8n
          </p>
          <h1 className="mt-6 text-4xl font-bold uppercase leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            Your n8n chat,
            <br />
            secured and multi-tenant.
          </h1>
          <div className="m-stripe mt-6 w-40" />
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-neutral-300">
            A white-label chat frontend and security gateway for n8n Chat workflows. Keep the webhook server-side,
            rate limit every visitor, gate access with signed sessions, and hand clients a widget that embeds with
            one script tag.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={cta}>Start free workspace</Link>
            <Link href="#how" className={ctaOutline}>See how it works</Link>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-neutral-400">
            <li>Works with n8n Cloud and self-hosted</li>
            <li>Your webhook never reaches the browser</li>
            <li>Chat content is never stored</li>
          </ul>

          <div className="mt-10">
            <p className={eyebrow}>Embed any bot</p>
            <pre className="mt-2 overflow-x-auto border border-white/10 bg-[#0d0d0d] p-4 font-mono text-sm text-[#4a90e2]">
              <code>{`<script src="https://www.chatnode.app/embed.js" data-bot="BOT_ID" defer></script>`}</code>
            </pre>
          </div>
        </div>

        <div className="lg:pt-10">
          {bot ? (
            <Chat config={publicConfig(bot)} variant="panel" />
          ) : (
            <div className="grid h-[560px] place-items-center border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-neutral-400">
              Run <code className="mx-1 bg-black/40 px-1.5 py-0.5 font-mono text-[#4a90e2]">npm run seed</code> to create the demo bot.
            </div>
          )}
          <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-500">
            Live demo &middot; a real bot through the real gateway
          </p>
        </div>
      </div>

      {/* 2. Problem */}
      <section className="relative border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className={eyebrow}>The problem</p>
          <h2 className={`${h2} mt-3`}>Why a raw n8n chat trigger is a liability in production</h2>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-neutral-300">
            n8n is excellent at building the assistant. It was never meant to be the public front door for one.
            Put a raw trigger on a live site and three things are true on day one.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {RISKS.map(([title, body]) => (
              <div key={title} className="border-l-2 border-[#e22718] bg-white/[0.02] p-5">
                <h3 className="text-sm font-bold uppercase tracking-[1px] text-white">{title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-neutral-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section id="how" className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className={eyebrow}>How it works</p>
          <h2 className={`${h2} mt-3`}>One hop, and everything gets checked on the way through</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["1. Origin checked", "The embed loader mints the session from your page, so the real parent origin is validated against the bot's domain allowlist."],
              ["2. Caller identified", "An API key, a signed-in workspace member, or a visitor token bound to that one bot. Nothing else gets through."],
              ["3. Limits applied", "IP bans, country rules, per-IP and per-session buckets, spam traps, and the message allowance, in that order."],
              ["4. Forwarded and streamed", "Only then does the request reach your n8n webhook, and the reply streams back to the widget as it is written."],
            ].map(([title, body]) => (
              <div key={title} className="border border-white/10 bg-white/[0.02] p-5">
                <h3 className="text-sm font-bold uppercase tracking-[1px] text-[#4a90e2]">{title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-neutral-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features */}
      <section className="relative border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className={eyebrow}>Built for agencies</p>
          <h2 className={`${h2} mt-3`}>Security and tenancy, not just a nicer chat box</h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="border-l-2 border-[#1c69d4] pl-4">
                <h3 className="text-sm font-bold uppercase tracking-[1px] text-white">{title}</h3>
                <p className="mt-1.5 text-sm font-light leading-relaxed text-neutral-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section id="pricing" className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className={eyebrow}>Pricing</p>
          <h2 className={`${h2} mt-3`}>Simple, predictable pricing</h2>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-neutral-300">
            Every plan includes a monthly message allowance. Top-up credits cover anything past it and never expire.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col border p-6 ${p.id === "pro" ? "border-[#1c69d4] bg-[#1c69d4]/10" : "border-white/10 bg-white/[0.02]"}`}
              >
                <p className="text-sm font-bold uppercase tracking-[1.5px] text-white">{p.label}</p>
                <p className="mt-2 text-3xl font-bold">
                  ${p.price}
                  <span className="text-sm font-light text-neutral-400">/mo</span>
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm font-light text-neutral-400">
                  <li>{p.monthlyMessages.toLocaleString()} messages / month</li>
                  <li>{p.maxBots} bot{p.maxBots === 1 ? "" : "s"}</li>
                  <li>{p.maxMembers} seat{p.maxMembers === 1 ? "" : "s"}</li>
                  <li>{p.canHideBranding ? "Badge removable" : "Chatnode badge shown"}</li>
                </ul>
                <Link href="/signup" className={`${p.id === "pro" ? cta : ctaOutline} mt-6 w-full`}>
                  {p.price === 0 ? "Start free" : `Choose ${p.label}`}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            {paid.length} paid tiers, billed monthly through Stripe. Cancel from the billing portal at any time.
          </p>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="relative border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className={eyebrow}>FAQ</p>
          <h2 className={`${h2} mt-3`}>Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
                  {q}
                  <span className="text-[#4a90e2] transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-sm font-light leading-relaxed text-neutral-400">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Closing CTA */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className={h2}>Put a gateway in front of your workflow</h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-neutral-300">
            Create a workspace, paste a webhook URL, and embed the widget. The free plan needs no card.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cta}>Start free workspace</Link>
            <Link href="/docs" className={ctaOutline}>Read the docs</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
