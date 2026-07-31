"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Permanently delete your ChatFlowGate account. This cannot be undone.
      </p>
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="rounded-lg border border-red-300 bg-white dark:border-red-900/50 dark:bg-neutral-900/60 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-red-500"
      />
      <div>
        <button
          disabled={confirm !== "DELETE" || busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            const r = await authClient.deleteUser();
            setBusy(false);
            if (r.error) setErr(r.error.message || "Failed");
            else {
              router.push("/");
              router.refresh();
            }
          }}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-40 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          {busy ? "Deleting..." : "Delete account"}
        </button>
      </div>
      {err && <p className="text-sm text-red-700 dark:text-red-400">{err}</p>}
    </div>
  );
}