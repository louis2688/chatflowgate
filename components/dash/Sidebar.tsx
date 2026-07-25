"use client";

import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SignOutButton from "./SignOutButton";

const icon = (d: string) => (
  <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const NAV = [
  { href: "/dashboard", label: "Overview", icon: icon("M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z") },
  { href: "/analytics", label: "Analytics", icon: icon("M3 3v18h18M7 14l4-4 3 3 5-6") },
  { href: "/sessions", label: "Sessions", icon: icon("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75") },
  { href: "/bots", label: "Bots", icon: icon("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z") },
  { href: "/billing", label: "Billing", icon: icon("M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20") },
  { href: "/security", label: "Security", icon: icon("M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z") },
  { href: "/docs", label: "Docs", icon: icon("M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z") },
  { href: "/settings", label: "Settings", icon: icon("M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6") },
];

export default function Sidebar({ orgName, userEmail }: { orgName: string; userEmail: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar") === "collapsed");
    } catch {
      /* storage blocked */
    }
  }, []);

  function toggle() {
    const c = !collapsed;
    setCollapsed(c);
    try {
      localStorage.setItem("sidebar", c ? "collapsed" : "expanded");
    } catch {
      /* storage blocked */
    }
  }

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-neutral-200 p-3 dark:border-neutral-800 sm:flex ${collapsed ? "w-16" : "w-60"}`}
    >
      <div className="m-stripe -mx-3 -mt-3 mb-3" />
      <div className={collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"}>
        <Link href="/dashboard" title="Chatnode" className="px-1">
          {collapsed ? (
            <Image src="/icon.png" alt="Chatnode" width={30} height={30} priority className="h-[30px] w-[30px]" />
          ) : (
            <Logo className="h-auto w-[112px]" priority />
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>

      {!collapsed && <p className="mt-1 truncate px-2 text-xs text-neutral-500">{orgName}</p>}

      <nav className="mt-6 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg py-2 text-sm transition-colors ${collapsed ? "justify-center px-0" : "px-3"} ${
                active
                  ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white"
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-neutral-200 pt-3 dark:border-neutral-800">
        {!collapsed && <p className="truncate px-2 text-xs text-neutral-500">{userEmail}</p>}
        <div className={collapsed ? "flex justify-center pt-1" : "px-2 pt-1"}>
          <SignOutButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}