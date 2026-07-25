"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthForm({ mode, showGoogle }: { mode: "login" | "signup"; showGoogle: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const res = isSignup
      ? await authClient.signUp.email({ email, password, name: String(fd.get("name") || "") })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setErr(res.error.message || "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const field = "w-full rounded-lg border border-neutral-700 bg-neutral-900/60 px-3.5 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-500";

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-6 inline-block">
        <Logo onDark priority className="h-20 w-auto" />
      </Link>
      <h1 className="font-display text-2xl font-semibold">{isSignup ? "Create your workspace" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        {isSignup ? "Start securing your n8n chatbots." : "Sign in to your Chatnode dashboard."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {isSignup && <input name="name" placeholder="Your name" autoComplete="name" className={field} />}
        <input name="email" type="email" required placeholder="you@company.com" autoComplete="email" className={field} />
        <input name="password" type="password" required minLength={8} placeholder="Password (min 8 chars)" autoComplete={isSignup ? "new-password" : "current-password"} className={field} />
        {err && <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-400 disabled:opacity-50">
          {busy ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      {showGoogle && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-neutral-600">
            <span className="h-px flex-1 bg-neutral-800" /> or <span className="h-px flex-1 bg-neutral-800" />
          </div>
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Continue with Google
          </button>
        </>
      )}

      <p className="mt-6 text-sm text-neutral-400">
        {isSignup ? "Already have an account? " : "No account yet? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-emerald-400 hover:underline">
          {isSignup ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}