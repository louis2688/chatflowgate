// Runnable self-check: node test/selfcheck.ts
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { issueSession, verifySession } from "../lib/token.ts";
import { rateLimit } from "../lib/ratelimit.ts";
import { clientIp, devTopUpAllowed, intEnv } from "../lib/config.ts";
import { assertHttpUrl } from "../lib/ssrf.ts";
import { parseDelta } from "../lib/stream.ts";
import { webhookAuthHeaders } from "../lib/webhook-auth.ts";
import { readableText } from "../lib/contrast.ts";
import { planOf, PLANS, PACKAGES } from "../lib/plans.ts";
import { geoAllowed } from "../lib/geo.ts";

process.env.SESSION_SECRET = "test-secret-0123456789012345678901234567";

// --- token: bound to a bot ---
const token = issueSession("botA");
const s = verifySession(token);
assert.ok(s, "valid token verifies");
assert.equal(s.botId, "botA", "botId round-trips");
assert.ok(s.exp > Math.floor(Date.now() / 1000), "expiry in the future");

// tampering + malformed rejected
const [body, sig] = token.split(".");
assert.equal(verifySession(`${body}x.${sig}`), null, "tampered body rejected");
assert.equal(verifySession(`${body}.AAAA${sig.slice(4)}`), null, "tampered sig rejected");
assert.equal(verifySession(""), null);
assert.equal(verifySession("garbage"), null);
assert.equal(verifySession(null), null);
assert.equal(verifySession(issueSession("botA", -10)), null, "expired rejected");

// wrong secret rejected
process.env.SESSION_SECRET = "another-secret-987654321098765432109876";
assert.equal(verifySession(token), null, "old-secret token rejected");
process.env.SESSION_SECRET = "test-secret-0123456789012345678901234567";

// --- rate limit ---
for (let i = 0; i < 3; i++) assert.ok((await rateLimit("t1", 3, 10_000)).ok);
const denied = await rateLimit("t1", 3, 10_000);
assert.equal(denied.ok, false, "over-budget denied");
assert.ok(denied.retryAfterSec >= 1);
assert.ok((await rateLimit("t2", 2, 200)).ok);
assert.ok((await rateLimit("t2", 2, 200)).ok);
assert.equal((await rateLimit("t2", 2, 200)).ok, false);
await sleep(250);
assert.ok((await rateLimit("t2", 2, 200)).ok, "refilled after window");
assert.ok((await rateLimit("t3", 1, 10_000)).ok);
assert.ok((await rateLimit("t4", 1, 10_000)).ok, "keys independent");

// --- intEnv ---
delete process.env.RL;
assert.equal(intEnv("RL", 20), 20);
process.env.RL = "";
assert.equal(intEnv("RL", 20), 20, "empty -> default");
process.env.RL = "0";
assert.equal(intEnv("RL", 20), 20, "zero -> default");
process.env.RL = "45";
assert.equal(intEnv("RL", 20), 45);
delete process.env.RL;

// --- clientIp: XFF spoof resistance ---
const mk = (h) => ({ headers: { get: (k) => h[k.toLowerCase()] ?? null } });
process.env.TRUST_PROXY_HOPS = "1";
assert.equal(clientIp(mk({ "x-forwarded-for": "1.2.3.4, 9.9.9.9" })), "9.9.9.9", "rightmost real peer");
process.env.TRUST_PROXY_HOPS = "0";
assert.equal(clientIp(mk({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "7.7.7.7" })), "7.7.7.7", "0 hops ignores XFF");
assert.equal(clientIp(mk({})), "unknown");
delete process.env.TRUST_PROXY_HOPS;

// --- ssrf guard (ALLOW_PRIVATE_WEBHOOKS unset in the check env) ---
for (const bad of [
  "http://169.254.169.254/latest/meta-data/",
  "http://127.0.0.1:5678/x",
  "http://localhost/hook",
  "http://10.0.0.5/",
  "http://192.168.1.1/",
  "http://172.16.9.9/",
  "ftp://example.com/",
  "http://[::1]/",
  "http://metadata.google.internal/",
]) {
  assert.throws(() => assertHttpUrl(bad), `blocks ${bad}`);
}
for (const good of ["https://n8n.example.com/webhook/x", "http://8.8.8.8/hook"]) {
  assert.doesNotThrow(() => assertHttpUrl(good), `allows ${good}`);
}

// --- stream parseDelta ---
assert.equal(parseDelta('{"content":"Hel"}'), "Hel");
assert.equal(parseDelta('data: {"content":"lo"}'), "lo");
assert.equal(parseDelta('{"output":"full reply"}'), "full reply");
assert.equal(parseDelta('[{"output":"arr"}]'), "arr");
assert.equal(parseDelta('{"delta":"x"}'), "x");
assert.equal(parseDelta("data: [DONE]"), "");
assert.equal(parseDelta('{"type":"begin"}'), "", "control frame -> empty");
assert.equal(parseDelta(""), "");
assert.equal(parseDelta("plain token"), "plain token");

// --- dev credit top-up gate ---
// Granting credits without payment must never be reachable in production.
{
  const env = process.env;
  const restore = { n: env.NODE_ENV, a: env.ALLOW_DEV_TOPUP, s: env.STRIPE_SECRET_KEY };
  const set = (node: string, allow?: string, stripe?: string) => {
    Object.defineProperty(env, "NODE_ENV", { value: node, configurable: true, writable: true, enumerable: true });
    if (allow === undefined) delete env.ALLOW_DEV_TOPUP; else env.ALLOW_DEV_TOPUP = allow;
    if (stripe === undefined) delete env.STRIPE_SECRET_KEY; else env.STRIPE_SECRET_KEY = stripe;
  };

  set("development");
  assert.equal(devTopUpAllowed(), true, "dev: top-up allowed");
  set("production");
  assert.equal(devTopUpAllowed(), false, "production: top-up REFUSED");
  set("production", "true");
  assert.equal(devTopUpAllowed(), true, "production + explicit opt-in: allowed");
  set("production", "yes");
  assert.equal(devTopUpAllowed(), false, "opt-in must be exactly true");
  set("development", undefined, "sk_live_x");
  assert.equal(devTopUpAllowed(), false, "stripe configured: real payments take over");
  set("production", "true", "sk_live_x");
  assert.equal(devTopUpAllowed(), false, "stripe wins over the escape hatch");

  Object.defineProperty(env, "NODE_ENV", { value: restore.n, configurable: true, writable: true, enumerable: true });
  if (restore.a === undefined) delete env.ALLOW_DEV_TOPUP; else env.ALLOW_DEV_TOPUP = restore.a;
  if (restore.s === undefined) delete env.STRIPE_SECRET_KEY; else env.STRIPE_SECRET_KEY = restore.s;
}

// --- webhook auth headers ---
assert.deepEqual(webhookAuthHeaders({ webhookAuthType: "none", webhookAuthHeader: "X", webhookAuthValue: "Y" }), {}, "none -> nothing");
assert.deepEqual(
  webhookAuthHeaders({ webhookAuthType: "header", webhookAuthHeader: "X-Api-Key", webhookAuthValue: "secret" }),
  { "X-Api-Key": "secret" },
  "header -> name:value",
);
assert.equal(
  webhookAuthHeaders({ webhookAuthType: "basic", webhookAuthHeader: "user", webhookAuthValue: "pass" }).Authorization,
  "Basic " + Buffer.from("user:pass").toString("base64"),
  "basic -> base64(user:pass)",
);
assert.deepEqual(webhookAuthHeaders({ webhookAuthType: "header", webhookAuthHeader: "", webhookAuthValue: "y" }), {}, "header needs a name");
assert.deepEqual(webhookAuthHeaders({ webhookAuthType: "basic", webhookAuthHeader: "", webhookAuthValue: "p" }), {}, "basic needs a username");
assert.ok(webhookAuthHeaders({ webhookAuthType: "basic", webhookAuthHeader: "u", webhookAuthValue: "" }).Authorization, "basic allows an empty password");

// --- readable text contrast ---
assert.equal(readableText("#ffffff"), "#111111", "dark text on white");
assert.equal(readableText("#000000"), "#ffffff", "white text on black");
assert.equal(readableText("#1c69d4"), "#ffffff", "white stays on the default brand blue");
assert.equal(readableText("#ffdd00"), "#111111", "dark text on a light yellow brand");
assert.equal(readableText("garbage"), "#ffffff", "invalid colour defaults to white");

// --- plan limits ---
// Must fail CLOSED: an unknown or tampered plan value can never unlock a paid tier.
for (const bad of [null, undefined, "", "enterprise", "MAX", "pro "]) {
  assert.equal(planOf(bad as string | null).id, "free", "unknown plan falls back to free");
}
assert.equal(planOf("pro").maxBots, 10);
assert.equal(planOf("pro").maxMembers, 3);
assert.equal(planOf("max").maxBots, 30);
assert.equal(planOf("max").maxMembers, 6);
assert.equal(PLANS.free.canHideBranding, false, "free cannot hide branding");
assert.ok(PLANS.pro.canHideBranding && PLANS.max.canHideBranding, "paid tiers can hide branding");

// --- message allowances ---
assert.equal(PLANS.free.monthlyMessages, 500);
assert.equal(PLANS.pro.monthlyMessages, 10_000);
assert.equal(PLANS.max.monthlyMessages, 50_000);

// Dominance rule: a plan must include at least as many messages as its own price
// would buy as a top-up pack. If this ever fails, buying packs beats subscribing
// and the two systems start competing with each other.
for (const plan of [PLANS.pro, PLANS.max]) {
  const affordable = PACKAGES.filter((p) => p.price <= plan.price).map((p) => p.credits);
  const best = affordable.length ? Math.max(...affordable) : 0;
  assert.ok(
    plan.monthlyMessages >= best,
    `${plan.label} includes ${plan.monthlyMessages} but $${plan.price} buys ${best} as credits`,
  );
}

// --- geofencing ---
// Unknown country is deliberately asymmetric: deny under an allowlist (fail
// closed), allow under a blocklist (cannot prove the visitor is blocked).
const allowPH = { geoMode: "allow", geoCountries: ["PH", "SG"] };
const blockRU = { geoMode: "block", geoCountries: ["RU"] };
assert.equal(geoAllowed({ geoMode: "off", geoCountries: [] }, "RU"), true, "off allows everyone");
assert.equal(geoAllowed(allowPH, "PH"), true, "allowlist admits a listed country");
assert.equal(geoAllowed(allowPH, "US"), false, "allowlist refuses an unlisted country");
assert.equal(geoAllowed(allowPH, null), false, "allowlist refuses an unknown country");
assert.equal(geoAllowed(allowPH, "ph"), true, "country match is case-insensitive");
assert.equal(geoAllowed(blockRU, "RU"), false, "blocklist refuses a listed country");
assert.equal(geoAllowed(blockRU, "PH"), true, "blocklist admits everyone else");
assert.equal(geoAllowed(blockRU, null), true, "blocklist admits an unknown country");
assert.equal(geoAllowed({ geoMode: "allow", geoCountries: [] }, "PH"), true, "empty list is not a fence");
assert.equal(geoAllowed({ geoMode: "garbage", geoCountries: ["RU"] }, "RU"), true, "unknown mode does not fence");

console.log("selfcheck: all assertions passed");