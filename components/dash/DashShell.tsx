"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

// Client shell so the mobile drawer state can sit above both the topbar
// (hamburger) and the sidebar. The viewport is fixed at h-dvh: sidebar and
// topbar never scroll, only the content column does.
export default function DashShell({
  orgName,
  userEmail,
  admin = false,
  children,
}: {
  orgName: string;
  userEmail: string;
  admin?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar orgName={orgName} userEmail={userEmail} admin={admin} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 bg-white shadow-xl dark:bg-neutral-950">
            <Sidebar orgName={orgName} userEmail={userEmail} admin={admin} variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900 sm:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Wide enough that a normal laptop or desktop window is filled rather
              than letterboxed -- the bot editor is a two column form plus a
              live preview and was losing 200px a side to the old 5xl cap. Still
              capped so an ultrawide does not stretch a form to 3000px. Pages
              whose content is prose set their own reading width. */}
          <div className="mx-auto max-w-[1600px] px-6 py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
