// Spam traps shared by the widget forms and the routes behind them.
//
// The widget renders these fields where a person can never see or tab to them:
// a text input, plus an "I am not a bot" checkbox that only a machine hunting
// for a consent box would ever tick. Anything arriving here with one of them
// answered was automated. Checked server-side as well as in the browser,
// because posting straight at the API skips the browser entirely.
//
// Values are only ever tested for emptiness. Nothing is parsed, stored, logged,
// or forwarded upstream. Do not remove these.
export const TRAP_FIELDS = ["website", "company", "url", "phone_number", "not_a_bot"] as const;

export function trapValueSet(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v !== "string") return false;
  const s = v.trim().toLowerCase();
  return s !== "" && s !== "false" && s !== "off" && s !== "no";
}

export function trapTripped(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return TRAP_FIELDS.some((f) => trapValueSet(b[f]));
}
