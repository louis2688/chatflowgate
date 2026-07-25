"use client";

import { useState } from "react";
import Link from "next/link";
import { createBotAction, updateBotAction, deleteBotAction } from "@/app/(dash)/actions";
import WebhookAuth from "./WebhookAuth";
import CopyField from "./CopyField";
import type { Bot } from "@/lib/bots";

const field =
  "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-500";
const label = "block text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400 mb-1.5";

const svg = (children: React.ReactNode, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const BotGlyph = (s?: number) => svg(<><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></>, s);
const Minus = () => svg(<line x1="5" y1="12" x2="19" y2="12" />, 16);
const Send = () => svg(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>, 14);

const POSITIONS = [
  ["bottom-right", "Bottom right"],
  ["bottom-left", "Bottom left"],
  ["top-right", "Top right"],
  ["top-left", "Top left"],
] as const;

type PreviewState = {
  name: string;
  welcome: string;
  color: string;
  logoUrl: string;
  widgetType: "popup" | "inline";
  position: string;
  greeting: string;
  buttonText: string;
  // raw textarea text, one prompt per line
  suggestedPrompts: string;
  widgetWidth: number;
  widgetHeight: number;
};

function Avatar({ logoUrl, color }: { logoUrl: string; color: string }) {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-white" style={{ background: "rgba(255,255,255,0.25)" }}>
      {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : BotGlyph(18)}
    </div>
  );
}

function ChatWindow({ s }: { s: PreviewState }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-lg dark:bg-neutral-900">
      <div className="flex items-center gap-2.5 p-3.5 text-white" style={{ background: s.color }}>
        <Avatar logoUrl={s.logoUrl} color={s.color} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.name || "Bot"}</span>
        <button type="button" className="opacity-85" tabIndex={-1}><Minus /></button>
      </div>
      <div className="flex-1 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-800/40">
        <div className="max-w-[85%] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {s.welcome || "Hi! How can I help you today?"}
        </div>
        {(() => {
          const prompts = s.suggestedPrompts.split("\\n").map((x) => x.trim()).filter(Boolean);
          if (prompts.length === 0) return null;
          return (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {prompts.map((q, i) => (
                <span
                  key={i}
                  className="rounded-full border px-2.5 py-1 text-[11px]"
                  style={{ borderColor: s.color, color: s.color }}
                >
                  {q}
                </span>
              ))}
            </div>
          );
        })()}
      </div>
      <div className="flex items-center gap-2 border-t border-neutral-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex-1 rounded-full border border-neutral-200 px-3 py-2 text-[13px] text-neutral-400 dark:border-neutral-700">Type a message...</div>
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-white" style={{ background: s.color }}><Send /></div>
      </div>
    </div>
  );
}

function Preview({ s, open, setOpen }: { s: PreviewState; open: boolean; setOpen: (v: boolean) => void }) {
  if (s.widgetType === "inline") {
    return <div className="h-full w-full p-2"><ChatWindow s={s} /></div>;
  }
  const align: Record<string, string> = {
    "bottom-right": "items-end justify-end",
    "bottom-left": "items-end justify-start",
    "top-right": "items-start justify-end",
    "top-left": "items-start justify-start",
  };
  const colReverse = s.position.startsWith("top") ? "flex-col-reverse" : "flex-col";
  const clusterAlign = s.position.endsWith("right") ? "items-end" : "items-start";
  return (
    <div className={`flex h-full w-full rounded-xl bg-white p-6 shadow-inner dark:bg-neutral-900 ${align[s.position]}`}>
      <div className={`flex ${colReverse} ${clusterAlign} gap-2`}>
        {open ? (
          <div
            className="max-h-full max-w-full overflow-hidden rounded-xl shadow-xl"
            style={{ width: s.widgetWidth * 0.65, height: s.widgetHeight * 0.5 }}
          >
            <ChatWindow s={s} />
          </div>
        ) : (
          <div className="max-w-[180px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            {s.greeting || s.welcome || "Hi! How can I help?"}
          </div>
        )}
        <button type="button" onClick={() => setOpen(!open)} className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full text-white shadow-lg" style={{ background: s.color }} aria-label={s.buttonText || "Open chat"}>
          {open ? svg(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, 22) : BotGlyph(22)}
        </button>
      </div>
    </div>
  );
}

export default function BotEditor({ bot }: { bot?: Bot }) {
  const editing = !!bot;
  const [tab, setTab] = useState<"settings" | "appearance">("settings");
  const [showEmbed, setShowEmbed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [s, setS] = useState<PreviewState & { allowAnonymous: boolean; geoMode: "off" | "allow" | "block" }>({
    name: bot?.name ?? "",
    welcome: bot?.welcome ?? "Hi! How can I help you today?",
    color: bot?.color ?? "#1c69d4",
    logoUrl: bot?.logoUrl ?? "",
    widgetType: (bot?.widgetType as "popup" | "inline") ?? "popup",
    position: bot?.position ?? "bottom-right",
    greeting: bot?.greeting ?? "",
    buttonText: bot?.buttonText ?? "Chat with us",
    suggestedPrompts: (bot?.suggestedPrompts ?? []).join("\n"),
    widgetWidth: bot?.widgetWidth ?? 400,
    widgetHeight: bot?.widgetHeight ?? 640,
    allowAnonymous: bot ? bot.allowAnonymous : true,
    geoMode: (bot?.geoMode as "off" | "allow" | "block") ?? "off",
  });
  const set = (patch: Partial<typeof s>) => setS((p) => ({ ...p, ...patch }));

  const origin = typeof window === "undefined" ? "https://www.chatnode.app" : window.location.origin;
  const snippet = `<script src="${origin}/embed.js" data-bot="${bot?.id ?? "BOT_ID"}" data-color="${s.color}" data-position="${s.position}" data-width="${s.widgetWidth}" data-height="${s.widgetHeight}" defer></script>`;
  const tabBtn = (id: "settings" | "appearance", text: string) =>
    <button type="button" onClick={() => setTab(id)} className={`flex-1 rounded-none border-b-2 px-3 py-3 text-sm font-medium ${tab === id ? "border-emerald-500 text-emerald-500" : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}>{text}</button>;

  return (
    <div>
      <Link href="/bots" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">&larr; Bots</Link>

      <form action={editing ? updateBotAction : createBotAction} className="mt-3">
        {editing && <input type="hidden" name="botId" value={bot!.id} />}

        <div className="flex items-center justify-between gap-3 rounded-t-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <h1 className="font-display truncate text-lg font-semibold">{s.name || "Untitled bot"}</h1>
          <div className="flex items-center gap-2">
            {editing && (
              <button type="button" onClick={() => setShowEmbed((v) => !v)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">Get embed code</button>
            )}
            <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-400">{editing ? "Save changes" : "Create bot"}</button>
          </div>
        </div>

        {showEmbed && (
          <div className="border-x border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/20">
            <CopyField value={snippet} />
            <p className="mt-2 text-xs text-neutral-500">Direct link: <Link href={`/widget/${bot?.id}`} className="text-emerald-400 hover:underline">/widget/{bot?.id}</Link></p>
          </div>
        )}

        <div className="grid rounded-b-xl border border-t-0 border-neutral-200 dark:border-neutral-800 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="flex flex-col border-b border-neutral-200 dark:border-neutral-800 lg:border-b-0 lg:border-r">
            <div className="flex border-b border-neutral-200 dark:border-neutral-800">
              {tabBtn("settings", "Settings")}
              {tabBtn("appearance", "Appearance")}
            </div>

            <div hidden={tab !== "settings"} className="space-y-4 p-5">
              <div>
                <label className={label} htmlFor="name">Name</label>
                <input id="name" name="name" required maxLength={80} value={s.name} onChange={(e) => set({ name: e.target.value })} placeholder="Support Assistant" className={field} />
              </div>
              <div>
                <label className={label} htmlFor="webhookUrl">n8n webhook URL</label>
                <input id="webhookUrl" name="webhookUrl" type="url" required defaultValue={bot?.webhookUrl} placeholder="https://your-n8n/webhook/xxxx/chat" className={field} />
                <p className="mt-1 text-xs text-neutral-500">Stays server-side. Never sent to the browser.</p>
              </div>
              <div>
                <label className={label} htmlFor="welcome">Welcome message</label>
                <textarea id="welcome" name="welcome" rows={2} maxLength={500} value={s.welcome} onChange={(e) => set({ welcome: e.target.value })} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="allowedOrigins">Allowed domains (one per line, empty = any)</label>
                <textarea id="allowedOrigins" name="allowedOrigins" rows={2} defaultValue={(bot?.allowedOrigins ?? []).join("\n")} placeholder="https://www.customer.com" className={field} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="ratePerSession">Rate / session / min</label>
                  <input id="ratePerSession" name="ratePerSession" type="number" min={1} max={1000} defaultValue={bot?.ratePerSession ?? 20} className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="ratePerIp">Rate / IP / min</label>
                  <input id="ratePerIp" name="ratePerIp" type="number" min={1} max={5000} defaultValue={bot?.ratePerIp ?? 60} className={field} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input type="checkbox" name="allowAnonymous" checked={s.allowAnonymous} onChange={(e) => set({ allowAnonymous: e.target.checked })} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600" />
                Allow anonymous
              </label>
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Lead capture {s.allowAnonymous && <span className="font-normal text-neutral-400">(used when anonymous is off)</span>}</p>
                <p className="mt-1 text-xs text-neutral-500">Name and email are always collected. The details reach your workflow as a <code>chat_started</code> event.</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <span className="flex items-center gap-2 text-sm text-neutral-400"><input type="checkbox" checked disabled className="h-4 w-4 rounded" /> Name</span>
                  <span className="flex items-center gap-2 text-sm text-neutral-400"><input type="checkbox" checked disabled className="h-4 w-4 rounded" /> Email</span>
                  <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" name="leadPhone" defaultChecked={bot?.leadPhone ?? false} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600" /> Phone</label>
                  <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" name="leadMessage" defaultChecked={bot ? bot.leadMessage : true} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600" /> Message</label>
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <label className={label} htmlFor="geoMode">Geofencing</label>
                <select id="geoMode" name="geoMode" value={s.geoMode} onChange={(e) => set({ geoMode: e.target.value as "off" | "allow" | "block" })} className={field}>
                  <option value="off">Off - allow every country</option>
                  <option value="allow">Allow only these countries</option>
                  <option value="block">Block these countries</option>
                </select>
                {s.geoMode !== "off" && (
                  <div className="mt-3">
                    <textarea
                      name="geoCountries"
                      rows={2}
                      defaultValue={(bot?.geoCountries ?? []).join("\\n")}
                      placeholder="PH&#10;US&#10;SG"
                      className={field}
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      Two-letter country codes, one per line. Visitors are refused before a session is issued.
                      {s.geoMode === "allow" && " Visitors we cannot locate are refused too."}
                    </p>
                  </div>
                )}
                {s.geoMode === "off" && <input type="hidden" name="geoCountries" value={(bot?.geoCountries ?? []).join("\\n")} />}
              </div>
              <WebhookAuth defaultType={(bot?.webhookAuthType as "none" | "basic" | "header") ?? "none"} defaultName={bot?.webhookAuthHeader ?? ""} defaultValue={bot?.webhookAuthValue ?? ""} />
            </div>

            <div hidden={tab !== "appearance"} className="space-y-4 p-5">
              <div>
                <label className={label}>Brand color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={s.color} onChange={(e) => set({ color: e.target.value })} className="h-9 w-10 rounded border border-neutral-300 dark:border-neutral-700" aria-label="Brand color picker" />
                  <input name="color" value={s.color} onChange={(e) => set({ color: e.target.value })} className={field} />
                </div>
              </div>
              <input type="hidden" name="widgetType" value={s.widgetType} />
              <div>
                <label className={label}>Type</label>
                <div className="flex gap-2.5">
                  {(["popup", "inline"] as const).map((t) => (
                    <button type="button" key={t} onClick={() => set({ widgetType: t })} className={`flex-1 rounded-lg border p-3 text-left ${s.widgetType === t ? "border-emerald-500 bg-emerald-500/5" : "border-neutral-200 dark:border-neutral-700"}`}>
                      <strong className="block text-sm capitalize">{t}</strong>
                      <span className="text-xs text-neutral-500">{t === "popup" ? "Floats over the page, opens on click" : "Embeds directly in the page layout"}</span>
                    </button>
                  ))}
                </div>
              </div>
              {s.widgetType === "popup" && (
                <div>
                  <label className={label} htmlFor="position">Position</label>
                  <select id="position" name="position" value={s.position} onChange={(e) => set({ position: e.target.value })} className={field}>
                    {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              )}
              {s.widgetType === "inline" && <input type="hidden" name="position" value={s.position} />}
              {s.widgetType === "popup" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="widgetWidth">Width (px)</label>
                    <input id="widgetWidth" name="widgetWidth" type="number" min={280} max={600} value={s.widgetWidth}
                      onChange={(e) => { set({ widgetWidth: Number(e.target.value) || 0 }); setPreviewOpen(true); }} className={field} />
                  </div>
                  <div>
                    <label className={label} htmlFor="widgetHeight">Height (px)</label>
                    <input id="widgetHeight" name="widgetHeight" type="number" min={320} max={900} value={s.widgetHeight}
                      onChange={(e) => { set({ widgetHeight: Number(e.target.value) || 0 }); setPreviewOpen(true); }} className={field} />
                  </div>
                </div>
              )}
              {s.widgetType === "inline" && (
                <>
                  <input type="hidden" name="widgetWidth" value={s.widgetWidth} />
                  <input type="hidden" name="widgetHeight" value={s.widgetHeight} />
                </>
              )}
              <div>
                <label className={label} htmlFor="buttonText">Button text</label>
                <input id="buttonText" name="buttonText" maxLength={40} value={s.buttonText} onChange={(e) => set({ buttonText: e.target.value })} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="greeting">Greeting message</label>
                <textarea
                  id="greeting"
                  name="greeting"
                  rows={2}
                  maxLength={500}
                  value={s.greeting}
                  onChange={(e) => {
                    set({ greeting: e.target.value });
                    setPreviewOpen(false); // the greeting only shows on the collapsed bubble
                  }}
                  placeholder="Shown as a bubble before the visitor opens the chat"
                  className={field}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  {s.widgetType === "inline"
                    ? "Only used by the popup type, which has a closed state to show it in."
                    : "Appears next to the launcher before the visitor opens the chat."}
                </p>
              </div>
              <div>
                <label className={label} htmlFor="logoUrl">Logo URL</label>
                <input id="logoUrl" name="logoUrl" type="url" value={s.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://..." className={field} />
              </div>
              <div>
                <label className={label} htmlFor="suggestedPrompts">Suggested prompts (one per line)</label>
                <textarea
                  id="suggestedPrompts"
                  name="suggestedPrompts"
                  rows={2}
                  value={s.suggestedPrompts}
                  onChange={(e) => set({ suggestedPrompts: e.target.value })}
                  placeholder="What can you do?&#10;Talk to a human"
                  className={field}
                />
              </div>

              <details className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <summary className="cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">Advanced</summary>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" name="rtl" defaultChecked={bot?.rtl ?? false} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600" /> RTL layout</label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" name="consentRequired" defaultChecked={bot?.consentRequired ?? false} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600" /> Consent screen</label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"><input type="checkbox" name="allowFileUpload" defaultChecked={bot?.allowFileUpload ?? false} className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600" /> File upload</label>
                  </div>
                  <div>
                    <label className={label} htmlFor="consentText">Consent text</label>
                    <input id="consentText" name="consentText" maxLength={1000} defaultValue={bot?.consentText ?? ""} className={field} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={label} htmlFor="maxFileSizeMb">Max file size (MB)</label>
                      <input id="maxFileSizeMb" name="maxFileSizeMb" type="number" min={1} max={10} defaultValue={bot?.maxFileSizeMb ?? 5} className={field} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="allowedFileTypes">Allowed types (empty = any)</label>
                      <input id="allowedFileTypes" name="allowedFileTypes" defaultValue={(bot?.allowedFileTypes ?? []).join(", ")} placeholder="image/png, application/pdf" className={field} />
                    </div>
                  </div>
                  <div>
                    <label className={label} htmlFor="customCss">Custom CSS</label>
                    <textarea id="customCss" name="customCss" rows={3} defaultValue={bot?.customCss ?? ""} placeholder=".md-body a { color: hotpink; }" className={`${field} font-mono text-xs`} />
                    <div className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                      <p>Classes you can target:</p>
                      <ul className="mt-1 space-y-0.5">
                        <li><code className="text-emerald-600 dark:text-emerald-400">.md-body</code> - the bot reply. Style children too: <code className="text-emerald-600 dark:text-emerald-400">a, code, pre, ul, ol, blockquote, table, h1-h3</code></li>
                        <li><code className="text-emerald-600 dark:text-emerald-400">.chat-scroll</code> - the scrolling message list</li>
                        <li><code className="text-emerald-600 dark:text-emerald-400">.typing-dot</code> - the typing indicator dots</li>
                      </ul>
                      <p className="mt-1.5">
                        Your brand colour is available as <code className="text-emerald-600 dark:text-emerald-400">var(--brand)</code>, and a readable
                        text colour for it as <code className="text-emerald-600 dark:text-emerald-400">var(--brand-fg)</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <div className="min-h-[420px] bg-neutral-100 p-4 dark:bg-neutral-950/40 lg:min-h-[560px]">
            <Preview s={s} open={previewOpen} setOpen={setPreviewOpen} />
          </div>
        </div>
      </form>

      {editing && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/10">
          <h2 className="font-semibold text-red-500 dark:text-red-300">Danger zone</h2>
          <p className="mb-3 mt-1 text-sm text-neutral-600 dark:text-neutral-400">Deletes the bot. This cannot be undone.</p>
          <form action={deleteBotAction}>
            <input type="hidden" name="botId" value={bot!.id} />
            <button type="submit" className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20">Delete bot</button>
          </form>
        </div>
      )}
    </div>
  );
}