"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";

export type ActionResult = { ok: boolean; message: string } | null;

/**
 * A form whose server action returns { ok, message } instead of throwing, so a
 * predictable failure (plan limit, validation) surfaces as a toast rather than
 * Next's error page.
 */
export default function ActionForm({
  action,
  children,
  className,
  onSuccess,
  id,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  // Lets a submit button elsewhere in the document target this form via the
  // HTML form= attribute, for controls that cannot be nested inside it.
  id?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const { toast } = useToast();

  useEffect(() => {
    if (!state) return;
    toast(state.message, state.ok ? "success" : "error");
    if (state.ok) onSuccess?.();
    // onSuccess is intentionally excluded: callers pass inline closures, and
    // depending on it would re-toast on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, toast]);

  return (
    <form id={id} action={formAction} className={className}>
      {children}
    </form>
  );
}