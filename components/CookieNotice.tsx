"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const CONSENT_KEY = "chatnode.cookie-consent";
export const CONSENT_EVENT = "chatnode:consent";

/**
 * Cookie consent for the public site.
 *
 * This is a real gate, not a notice: Google Analytics sets _ga cookies, which
 * are not strictly necessary, so it must not load until the visitor opts in.
 * components/Analytics.tsx renders nothing until the choice here is "accepted",
 * so declining means the script is never fetched.
 *
 * Never shown inside /widget -- that runs in an iframe on a customer's site,
 * where their own banner governs and ours would be an intrusion.
 */
export default function CookieNotice() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const inWidget = pathname?.startsWith("/widget") ?? false;

  useEffect(() => {
    if (inWidget) return;
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setShow(true);
    } catch {
      // storage blocked: stay quiet rather than nag on every page view
    }
  }, [inWidget]);

  if (!show || inWidget) return null;

  function choose(value: "accepted" | "declined") {
    setShow(false);
    try {
      localStorage.setItem(CONSENT_KEY, value);
      window.dispatchEvent(new Event(CONSENT_EVENT));
    } catch {
      /* storage blocked */
    }
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-neutral-200 bg-white/95 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          We use essential cookies to keep you signed in. With your permission we also use Google Analytics to see which
          pages people visit. We never track visitors of the chat widget on your own site.{" "}
          <Link href="/privacy" className="text-emerald-500 underline underline-offset-2 hover:text-emerald-400">
            Privacy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}