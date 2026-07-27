"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { PublicBotConfig } from "@/lib/bots";

type Msg = { role: "user" | "bot" | "notice"; text: string };

marked.setOptions({ breaks: true, gfm: true });
function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false }) as string;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

// Spam trap. Bots fill in every field they can find, so a value here means the
// submission was automated. Do NOT remove these, and do NOT switch them to
// `display:none` or `hidden`: crawlers skip those, and a screen reader would
// still announce a hidden-by-attribute input. The clip/1px approach keeps the
// field in the DOM and reachable to a bot, while aria-hidden + tabIndex -1 keep
// it away from real users and assistive tech.
const trapWrap: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

function Honeypot({
  name,
  inputRef,
  checkRef,
}: {
  name: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  checkRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div style={trapWrap} aria-hidden="true">
      <label htmlFor={`cn-${name}`}>Leave this field empty</label>
      <input ref={inputRef} id={`cn-${name}`} type="text" name={name} defaultValue="" tabIndex={-1} autoComplete="off" />
      {/* Dave's trap, and it catches a different animal than the text field
          above: a bot hunting for the usual "prove you are human" box ticks
          this to look legitimate, which is precisely what exposes it. A real
          visitor never sees it, so it can only ever be ticked by a machine. */}
      <label htmlFor={`cn-${name}-human`}>I am not a bot</label>
      <input ref={checkRef} id={`cn-${name}-human`} type="checkbox" name="not_a_bot" tabIndex={-1} />
    </div>
  );
}

let memoryToken: string | null = null;
function tokenKey(botId: string) {
  return `chatnode.token.${botId}`;
}
function readToken(botId: string): string | null {
  try {
    const current = sessionStorage.getItem(tokenKey(botId));
    if (current) return current;
    // Adopt a session minted before the Chatnode rename, so a visitor mid-chat
    // is not bounced back to the lead form. Safe to drop once traffic has
    // cycled (sessions are 24h).
    const legacy = sessionStorage.getItem(`chatlayer.token.${botId}`);
    if (legacy) {
      // Keep the token even if the migration write fails (quota, write-blocked
      // storage). Bouncing a lead-capture visitor back to the form is the exact
      // thing this fallback exists to prevent, so fail open, not closed.
      memoryToken = legacy;
      try {
        sessionStorage.setItem(tokenKey(botId), legacy);
        sessionStorage.removeItem(`chatlayer.token.${botId}`);
      } catch {
        // retried next call; idempotent
      }
      return legacy;
    }
    return memoryToken;
  } catch {
    return memoryToken;
  }
}
function writeToken(botId: string, token: string) {
  memoryToken = token;
  try {
    sessionStorage.setItem(tokenKey(botId), token);
  } catch {
    // storage blocked; memoryToken holds it
  }
}

export default function Chat({
  config,
  variant = "full",
  hideBranding = false,
  onMinimize,
}: {
  config: PublicBotConfig;
  // "fill" sizes to its parent, so the live preview can honour the bot's
  // configured width and height instead of a fixed card.
  variant?: "full" | "panel" | "fill";
  hideBranding?: boolean;
  onMinimize?: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", text: config.welcome }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [consented, setConsented] = useState(!config.consentRequired);
  const [pendingFile, setPendingFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const fileRef = useRef<{ name: string; type: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Spam traps: one per form. Never read into state, never sent anywhere.
  const leadTrapRef = useRef<HTMLInputElement>(null);
  const leadBotRef = useRef<HTMLInputElement>(null);
  const chatTrapRef = useRef<HTMLInputElement>(null);
  const chatBotRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const asked = messages.some((m) => m.role === "user");
  const lastSent = useRef("");
  const [leadDone, setLeadDone] = useState(config.allowAnonymous);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // token handed in via the URL hash by embed.js (#t=...)
    if (typeof window !== "undefined" && window.location.hash.startsWith("#t=")) {
      writeToken(config.id, decodeURIComponent(window.location.hash.slice(3)));
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (!config.allowAnonymous && readToken(config.id)) setLeadDone(true);
    if (config.consentRequired) {
      try {
        if (sessionStorage.getItem(`chatnode.consent.${config.id}`) || sessionStorage.getItem(`chatlayer.consent.${config.id}`)) setConsented(true);
      } catch {
        /* storage blocked */
      }
    }
  }, [config.id, config.consentRequired]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function getToken(force = false): Promise<string | null> {
    if (!force) {
      const cached = readToken(config.id);
      if (cached) return cached;
    }
    // Lead capture bots never mint here: the token comes from the form below.
    if (!config.allowAnonymous) return null;
    const res = await fetch(`/api/session/${config.id}`, { method: "POST" });
    if (!res.ok) throw new Error("session_failed");
    const data = await res.json();
    writeToken(config.id, data.token);
    return data.token;
  }

  function postChat(token: string | null) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`/api/chat/${config.id}`, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ message: lastSent.current, ...(fileRef.current ? { file: fileRef.current } : {}) }),
    });
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (leadBusy) return;
    setLeadBusy(true);
    setLeadError(null);
    // Spam trap tripped: pretend it worked and drop it. Nothing is sent, and the
    // value is never read, stored, or logged.
    if (leadTrapRef.current?.value || leadBotRef.current?.checked) {
      if (leadTrapRef.current) leadTrapRef.current.value = "";
      if (leadBotRef.current) leadBotRef.current.checked = false;
      setLeadBusy(false);
      setLeadDone(true);
      return;
    }
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    // trap values must never reach the server
    fd.delete("website");
    fd.delete("not_a_bot");
    for (const k of ["name", "email", "phone", "message"] as const) {
      const v = String(fd.get(k) ?? "").trim();
      if (v) payload[k] = v;
    }
    try {
      const res = await fetch(`/api/session/${config.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setLeadError("Could not start the chat. Please check your details and try again.");
        return;
      }
      const data = await res.json();
      writeToken(config.id, data.token);
      setLeadDone(true);
      if (payload.message) void send(payload.message);
    } catch {
      setLeadError("Could not start the chat. Please try again.");
    } finally {
      setLeadBusy(false);
    }
  }

  async function send(raw: string) {
    const text = raw.trim();
    if ((!text && !pendingFile) || busy) return;
    // Spam trap tripped: clear the composer as if the message went out, but
    // never call the gateway.
    if (chatTrapRef.current?.value || chatBotRef.current?.checked) {
      chatTrapRef.current!.value = "";
      if (chatBotRef.current) chatBotRef.current.checked = false;
      setInput("");
      setPendingFile(null);
      return;
    }
    fileRef.current = pendingFile;
    lastSent.current = text || `Sent a file: ${pendingFile?.name ?? "file"}`;
    const label = pendingFile ? `${text}${text ? "\n" : ""}📎 ${pendingFile.name}` : text;
    setMessages((m) => [...m, { role: "user", text: label }]);
    setPendingFile(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setBusy(true);
    try {
      let res = await postChat(await getToken());
      if (res.status === 401) {
        if (config.allowAnonymous) res = await postChat(await getToken(true));
        else {
          setLeadDone(false);
          setMessages((m) => [...m, { role: "notice", text: "Your session expired. Please enter your details again." }]);
          return;
        }
      }
      if (res.status === 402) {
        setMessages((m) => [...m, { role: "notice", text: "This assistant is out of message credits." }]);
        return;
      }
      if (res.status === 429) {
        const wait = res.headers.get("Retry-After");
        setMessages((m) => [
          ...m,
          { role: "notice", text: wait ? `Sending too fast - try again in ${wait}s.` : "Sending too fast - give it a moment." },
        ]);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const reader = res.body?.getReader();
      if (!reader) {
        const t = await res.text();
        setMessages((m) => [...m, { role: "bot", text: t || "..." }]);
      } else {
        const decoder = new TextDecoder();
        let acc = "";
        let added = false;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          if (!added) {
            added = true;
            setBusy(false);
            setMessages((m) => [...m, { role: "bot", text: acc }]);
          } else {
            setMessages((m) => {
              const copy = m.slice();
              copy[copy.length - 1] = { role: "bot", text: acc };
              return copy;
            });
          }
        }
        if (!added) setMessages((m) => [...m, { role: "bot", text: acc || "..." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "notice", text: "Something went wrong - please try again." }]);
    } finally {
      fileRef.current = null;
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const shell =
    variant === "panel"
      ? "flex h-[560px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
      : variant === "fill"
        ? "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        : "flex h-dvh flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100";

  return (
    <div className={shell} dir={config.rtl ? "rtl" : "ltr"} style={{ "--brand": config.color, "--brand-fg": config.brandFg } as React.CSSProperties}>
      <header className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/60">
        {config.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand)] text-sm font-semibold text-[var(--brand-fg)]">
            {config.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{config.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Online
          </p>
        </div>
        <button
          type="button"
          aria-label="Minimize chat"
          title="Minimize"
          onClick={() => {
            if (onMinimize) return onMinimize();
            // Embedded in the loader's iframe: ask the parent to close the panel.
            // The payload carries nothing sensitive, and embed.js checks the origin.
            if (typeof window !== "undefined" && window.parent !== window) {
              window.parent.postMessage({ type: "chatnode:minimize" }, "*");
            }
          }}
          className="ms-auto grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      {!consented ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
            {config.consentText || "By continuing, you agree to chat with this assistant."}
          </p>
          <button
            type="button"
            onClick={() => {
              setConsented(true);
              try {
                sessionStorage.setItem(`chatnode.consent.${config.id}`, "1");
              } catch {
                /* storage blocked */
              }
            }}
            className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-[var(--brand-fg)]"
          >
            I agree, start chatting
          </button>
        </div>
      ) : !leadDone ? (
        <form onSubmit={submitLead} className="chat-scroll flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          <div>
            <p className="text-sm font-semibold">{config.leadTitle || "Let's get started"}</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {config.leadSubtitle || "A few details so we can help you properly."}
            </p>
          </div>
          {config.leadName && (
            <input name="name" required autoComplete="name" placeholder="Name" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-[var(--brand)] dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500" />
          )}
          {config.leadEmail && (
            <input name="email" type="email" required autoComplete="email" placeholder="Email" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-[var(--brand)] dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500" />
          )}
          {config.leadPhone && (
            <input name="phone" type="tel" required autoComplete="tel" placeholder="Phone" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-[var(--brand)] dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500" />
          )}
          {config.leadMessage && (
            <textarea name="message" required rows={3} placeholder="How can we help?" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-[var(--brand)] dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500 resize-none" />
          )}
          <Honeypot name="website" inputRef={leadTrapRef} checkRef={leadBotRef} />
          {leadError && <p className="text-xs text-red-500">{leadError}</p>}
          <button type="submit" disabled={leadBusy} className="mt-auto rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-[var(--brand-fg)] disabled:opacity-60">
            {leadBusy ? "Starting..." : "Start chat"}
          </button>
        </form>
      ) : (
        <>
          <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) =>
              m.role === "notice" ? (
                <p key={i} className="mx-auto w-fit max-w-[90%] rounded-full bg-amber-50 px-3 py-1 text-center text-xs text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  {m.text}
                </p>
              ) : m.role === "user" ? (
                <p key={i} className="ms-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[var(--brand)] px-3.5 py-2 text-sm text-[var(--brand-fg)]">
                  {m.text}
                </p>
              ) : mounted ? (
                <div key={i} className="md-body w-fit max-w-[85%] break-words rounded-2xl rounded-bl-md bg-neutral-100 px-3.5 py-2 text-sm dark:bg-neutral-800/80" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
              ) : (
                <p key={i} className="w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-neutral-100 px-3.5 py-2 text-sm dark:bg-neutral-800/80">
                  {m.text}
                </p>
              ),
            )}
            {busy && (
              <div role="status" aria-label={`${config.name} is typing`} className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-neutral-100 px-3.5 py-3 dark:bg-neutral-800/80">
                <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
                <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
                <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
              </div>
            )}
          </div>

          {!asked && config.suggestedPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {config.suggestedPrompts.map((p) => (
                <button key={p} type="button" onClick={() => send(p)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-neutral-700 dark:text-neutral-300">
                  {p}
                </button>
              ))}
            </div>
          )}

          {pendingFile && (
            <div className="flex items-center gap-2 px-4 pb-1 text-xs text-neutral-500">
              <span className="truncate">&#128206; {pendingFile.name}</span>
              <button type="button" onClick={() => setPendingFile(null)} className="text-red-400 hover:text-red-300">remove</button>
            </div>
          )}
          <form className="flex items-end gap-2 border-t border-neutral-100 p-3 dark:border-neutral-800/60" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <Honeypot name="company" inputRef={chatTrapRef} checkRef={chatBotRef} />
            {config.allowFileUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={config.allowedFileTypes.length ? config.allowedFileTypes.join(",") : undefined}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    if (f.size > config.maxFileSizeMb * 1024 * 1024) {
                      setMessages((m) => [...m, { role: "notice", text: `File too large (max ${config.maxFileSizeMb}MB).` }]);
                      return;
                    }
                    if (config.allowedFileTypes.length && !config.allowedFileTypes.includes(f.type)) {
                      setMessages((m) => [...m, { role: "notice", text: "File type not allowed." }]);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setPendingFile({ name: f.name, type: f.type, dataUrl: String(reader.result) });
                    reader.readAsDataURL(f);
                  }}
                />
                <button type="button" aria-label="Attach file" onClick={() => fileInputRef.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:border-[var(--brand)] dark:border-neutral-700">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={4000}
              placeholder="Type a message"
              aria-label="Message"
              className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-neutral-200 bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-neutral-500 focus:border-[var(--brand)] dark:border-neutral-700 dark:placeholder:text-neutral-400"
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand)] text-[var(--brand-fg)] transition-opacity disabled:opacity-40">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          {!hideBranding && (
            <p className="pb-2 text-center text-[10px] text-neutral-400 dark:text-neutral-600">Protected by Chatnode</p>
          )}
        </>
      )}
    </div>
  );
}