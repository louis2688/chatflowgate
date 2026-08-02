/**
 * Founder allow-list for /admin. Read from the environment, not hardcoded: this
 * repo is public, so a literal list would publish the founders' addresses in the
 * source. Set ADMIN_EMAILS in Vercel as a comma-separated list.
 *
 * ponytail: swap for a real role column on member the day a non-founder needs it.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
