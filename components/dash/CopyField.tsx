"use client";

import { useState } from "react";

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      {/* Deliberately fixed to black-on-white in BOTH themes: this is code to copy,
          and a terminal look reads the same wherever it is pasted. */}
      <code className="flex-1 overflow-x-auto rounded-lg border border-neutral-800 bg-black px-3 py-2 font-mono text-xs text-white">{value}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            setCopied(false);
          }
        }}
        className="shrink-0 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 text-xs text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}