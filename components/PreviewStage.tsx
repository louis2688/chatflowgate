"use client";

import { useState } from "react";
import Chat from "@/components/Chat";
import type { PublicBotConfig } from "@/lib/bots";

/**
 * Renders the real widget the way the bot is actually configured, on a mock
 * page, so the owner can confirm the settings before embedding. This is a live
 * test: messages hit the real gateway and the real n8n webhook, and they draw
 * from the workspace's message allowance.
 */
export default function PreviewStage({
  config,
  hideBranding,
  widgetType,
  position,
  width,
  height,
  buttonText,
  greeting,
}: {
  config: PublicBotConfig;
  hideBranding: boolean;
  widgetType: string;
  position: string;
  width: number;
  height: number;
  buttonText: string;
  greeting: string | null;
}) {
  const [open, setOpen] = useState(widgetType === "inline");

  if (widgetType === "inline") {
    return (
      <div className="flex justify-center">
        <div style={{ width, height, maxWidth: "100%" }}>
          <Chat config={config} variant="fill" hideBranding={hideBranding} />
        </div>
      </div>
    );
  }

  const corner: Record<string, string> = {
    "bottom-right": "items-end justify-end",
    "bottom-left": "items-end justify-start",
    "top-right": "items-start justify-end",
    "top-left": "items-start justify-start",
  };
  const stackDir = position.startsWith("top") ? "flex-col-reverse" : "flex-col";
  const stackAlign = position.endsWith("right") ? "items-end" : "items-start";

  return (
    <div
      className={`relative flex min-h-[640px] rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40 ${corner[position] ?? corner["bottom-right"]}`}
    >
      <div className={`flex ${stackDir} ${stackAlign} gap-3`}>
        {open ? (
          <div style={{ width, height, maxWidth: "100%", maxHeight: "70vh" }}>
            <Chat config={config} variant="fill" hideBranding={hideBranding} onMinimize={() => setOpen(false)} />
          </div>
        ) : (
          greeting && (
            <div className="max-w-[220px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md dark:border-neutral-700 dark:bg-neutral-800">
              {greeting}
            </div>
          )
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close chat" : buttonText || "Open chat"}
          className={`flex h-14 shrink-0 items-center justify-center gap-2 rounded-full shadow-lg transition-transform hover:scale-105 ${!open && buttonText ? "px-5" : "w-14"}`}
          style={{ background: config.color, color: config.brandFg }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            )}
          </svg>
          {!open && buttonText && <span className="text-sm font-medium">{buttonText}</span>}
        </button>
      </div>
    </div>
  );
}