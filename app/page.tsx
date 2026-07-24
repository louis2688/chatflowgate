import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import Chat from "@/components/Chat";
import { getBot, publicConfig } from "@/lib/bots";

export const dynamic = "force-dynamic";

const FEATURES: Array<[string, string]> = [
  ["Hidden webhooks", "Each bot's n8n URL lives server-side only. Visitors never see it, so nobody can scrape or hammer it directly."],
  ["Rate limiting", "Per-session and per-IP token buckets, tuned per bot. Abuse gets a 429 before it ever reaches n8n."],
  ["Multi-tenant SaaS", "Organizations, teams, usage analytics, and white-label branding built in."],
];

const cta = "inline-flex items-center justify-center rounded-[8px] bg-[#1c69d4] px-6 py-3 text-xs font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#0653b6]";
const ctaOutline = "inline-flex items-center justify-center rounded-[8px] border border-white/25 px-6 py-3 text-xs font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white";

export default async function Home() {
  const bot = await getBot("demo");
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <div className="m-stripe" />
      {/* M-blue background glow */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-[#1c69d4]/25 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-40 h-[420px] w-[520px] rounded-full bg-[#0653b6]/20 blur-[130px]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo onDark priority className="h-16 w-auto" />
        <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[1.5px]">
          <Link href="/login" className="text-neutral-300 transition-colors hover:text-white">Log in</Link>
          <Link href="/signup" className={cta.replace("px-6 py-3", "px-5 py-2.5")}>Start free</Link>
        </div>
      </nav>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-200">
            <svg className="h-3 w-3 text-[#1c69d4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" strokeLinejoin="round" />
            </svg>
            ChatLayer &middot; for n8n
          </p>
          <h1 className="mt-6 text-4xl font-bold uppercase leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            Your n8n chat,
            <br />
            secured and multi-tenant.
          </h1>
          <div className="m-stripe mt-6 w-40" />
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-neutral-300">
            A branded chat frontend and security gateway for n8n Chat workflows.
            Manage many bots, gate access with real auth, and
            ship a white-label widget your customers embed with one script tag.
          </p>

          <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {FEATURES.map(([title, desc]) => (
              <div key={title} className="border-l-2 border-[#1c69d4] pl-4">
                <dt className="text-sm font-bold uppercase tracking-[1px] text-white">{title}</dt>
                <dd className="mt-1.5 text-sm font-light leading-relaxed text-neutral-400">{desc}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signup" className={cta}>Create your workspace</Link>
            <Link href="/dashboard" className={ctaOutline}>Open dashboard</Link>
          </div>

          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-500">Embed any bot</p>
            <pre className="mt-2 overflow-x-auto border border-white/10 bg-[#0d0d0d] p-4 font-mono text-sm text-[#4a90e2]">
              <code>{`<script src="https://your-host/embed.js" data-bot="BOT_ID" defer></script>`}</code>
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
          <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-500">Live demo &middot; the &quot;demo&quot; bot</p>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
