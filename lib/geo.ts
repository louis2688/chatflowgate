// Per-bot country rules. Kept DB-free so the selfcheck can exercise the policy,
// since getting the unknown-country case wrong silently defeats the feature.

export type GeoMode = "off" | "allow" | "block";

export type GeoRule = {
  geoMode: string | null;
  geoCountries: string[] | null;
};

/**
 * Decide whether a visitor from `country` (ISO 3166-1 alpha-2, or null when the
 * platform gave us no geo header) may use this bot.
 *
 * Unknown country is deliberately asymmetric:
 *   - allowlist: DENY. An allowlist is a positive assertion, so something we
 *     cannot place must not slip through (fail closed).
 *   - blocklist: ALLOW. We cannot prove the visitor is in a blocked country,
 *     and failing closed here would lock out every visitor whenever the geo
 *     header is missing.
 */
export function geoAllowed(bot: GeoRule, country: string | null | undefined): boolean {
  const mode = (bot.geoMode ?? "off") as GeoMode;
  if (mode !== "allow" && mode !== "block") return true; // "off" or anything unrecognised
  const list = (bot.geoCountries ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (list.length === 0) return true; // configured but empty: no rule to apply
  const cc = country?.trim().toUpperCase();
  if (!cc) return mode === "block";
  return mode === "allow" ? list.includes(cc) : !list.includes(cc);
}