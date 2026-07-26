"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that shows a spinner while its form is submitting. Must live
 * inside a <form>: useFormStatus reads the status of the nearest one.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || rest.disabled} className={`${className} disabled:opacity-70`} {...rest}>
      <span className="inline-flex items-center justify-center gap-2">
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
        {pending && pendingLabel ? pendingLabel : children}
      </span>
    </button>
  );
}