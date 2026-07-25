"use client";

import { useState } from "react";

const field =
  "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-500";
const label = "block text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400 mb-1.5";

type Mode = "none" | "basic" | "header";

// Mirrors n8n's Authentication dropdown. The two inputs are reused: header
// name/value for "header", username/password for "basic". Matching the value
// key names the server already stores keeps the action untouched.
export default function WebhookAuth({
  defaultType,
  defaultName,
  defaultValue,
}: {
  defaultType: Mode;
  defaultName: string;
  defaultValue: string;
}) {
  const [mode, setMode] = useState<Mode>(defaultType);

  return (
    <details className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800" open={defaultType !== "none"}>
      <summary className="cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">Webhook authentication</summary>
      <p className="mt-2 text-xs text-neutral-500">
        Match whatever your n8n Chat Trigger expects. Chatnode sends these to the webhook; they never reach the browser.
      </p>

      <div className="mt-3">
        <label className={label} htmlFor="webhookAuthType">Authentication</label>
        <select
          id="webhookAuthType"
          name="webhookAuthType"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className={field}
        >
          <option value="none">None</option>
          <option value="basic">Basic Auth (username &amp; password)</option>
          <option value="header">Header Auth (custom header)</option>
        </select>
      </div>

      {mode === "basic" && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="wa-user">Username</label>
            <input id="wa-user" name="webhookAuthHeader" defaultValue={defaultName} autoComplete="off" placeholder="username" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="wa-pass">Password</label>
            <input id="wa-pass" name="webhookAuthValue" type="password" defaultValue={defaultValue} autoComplete="off" placeholder="password" className={field} />
          </div>
        </div>
      )}

      {mode === "header" && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="wa-name">Header name</label>
            <input id="wa-name" name="webhookAuthHeader" defaultValue={defaultName} autoComplete="off" placeholder="Authorization" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="wa-val">Header value</label>
            <input id="wa-val" name="webhookAuthValue" defaultValue={defaultValue} autoComplete="off" placeholder="Bearer sk_..." className={field} />
          </div>
        </div>
      )}
    </details>
  );
}