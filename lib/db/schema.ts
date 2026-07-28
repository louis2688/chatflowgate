import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const uid = () => crypto.randomUUID();
const now = () => new Date();
const ts = (name: string) => timestamp(name, { mode: "date", withTimezone: true });

// --- better-auth core ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
  updatedAt: ts("updatedAt").notNull().$defaultFn(now),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
  updatedAt: ts("updatedAt").notNull().$defaultFn(now),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("activeOrganizationId"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: ts("accessTokenExpiresAt"),
  refreshTokenExpiresAt: ts("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
  updatedAt: ts("updatedAt").notNull().$defaultFn(now),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expiresAt").notNull(),
  createdAt: ts("createdAt").$defaultFn(now),
  updatedAt: ts("updatedAt").$defaultFn(now),
});

// --- organization plugin ---
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
  metadata: text("metadata"),
  brandName: text("brandName"),
  hideBranding: boolean("hideBranding").notNull().default(false),
  customDomain: text("customDomain"),
  // Billing tier. Limits live in lib/plans.ts; enforced server-side.
  plan: text("plan").notNull().default("free"),
  // Messages used in the current billing period, and when that period began.
  // The allowance rolls lazily on first use after the period expires.
  allowanceUsed: integer("allowanceUsed").notNull().default(0),
  periodStart: ts("periodStart").notNull().$defaultFn(now),
  // Purchased top-up credits, used only after the monthly allowance runs out.
  // These do not expire.
  credits: integer("credits").notNull().default(0),
  // Stripe linkage. Null until the first checkout; the subscription id is
  // present only while a paid-plan subscription exists.
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  // Mirror of the Stripe subscription: "active" | "past_due" | "canceled" |
  // null (never subscribed). Drives the payment-trouble banner on /billing.
  stripeStatus: text("stripeStatus"),
  stripePeriodEnd: ts("stripePeriodEnd"),
});

// Processed Stripe webhook deliveries. The unique event id makes redeliveries
// no-ops at the door, instead of relying on every handler being idempotent.
export const stripeEvent = pgTable("stripeEvent", {
  id: text("id").primaryKey().$defaultFn(uid),
  stripeEventId: text("stripeEventId").notNull().unique(),
  type: text("type").notNull(),
  processedAt: ts("processedAt").notNull().$defaultFn(now),
});

export const creditTxn = pgTable("creditTxn", {
  id: text("id").primaryKey().$defaultFn(uid),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: ts("createdAt").notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("member_org_user_idx").on(t.organizationId, t.userId)],
);

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull().default("pending"),
  expiresAt: ts("expiresAt").notNull(),
  inviterId: text("inviterId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// --- app domain ---
export const bot = pgTable("bot", {
  id: text("id").primaryKey().$defaultFn(uid),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  welcome: text("welcome").notNull().default("Hi! How can I help you today?"),
  color: text("color").notNull().default("#1c69d4"),
  logoUrl: text("logoUrl"),
  suggestedPrompts: jsonb("suggestedPrompts").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  webhookUrl: text("webhookUrl").notNull(),
  // Webhook auth matches n8n's own choices. "none" | "basic" | "header".
  // The two columns below hold header-name/value for "header", or
  // username/password for "basic".
  webhookAuthType: text("webhookAuthType").notNull().default("none"),
  webhookAuthHeader: text("webhookAuthHeader"),
  webhookAuthValue: text("webhookAuthValue"),
  // Access mode. Anonymous (true): the visitor chats immediately. Lead capture
  // (false): the visitor must submit the enabled contact fields before a session
  // token is issued, and those details are forwarded to n8n as chat_started.
  allowAnonymous: boolean("allowAnonymous").notNull().default(true),
  // Heading and sub-heading above the lead form. Null falls back to the
  // wording the widget shipped with.
  leadTitle: text("leadTitle"),
  leadSubtitle: text("leadSubtitle"),
  leadName: boolean("leadName").notNull().default(true),
  leadEmail: boolean("leadEmail").notNull().default(true),
  leadPhone: boolean("leadPhone").notNull().default(false),
  leadMessage: boolean("leadMessage").notNull().default(true),
  allowedOrigins: jsonb("allowedOrigins").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Geofencing: "off" | "allow" (only these countries) | "block" (all but these).
  geoMode: text("geoMode").notNull().default("off"),
  geoCountries: jsonb("geoCountries").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  ratePerSession: integer("ratePerSession").notNull().default(20),
  ratePerIp: integer("ratePerIp").notNull().default(60),
  // Language the widget opens in. A visitor can still switch with the picker and
  // their choice wins for that browser; this is only the starting point, so a
  // customer selling into one market is not stuck greeting everyone in English.
  locale: text("locale").notNull().default("en"),
  rtl: boolean("rtl").notNull().default(false),
  customCss: text("customCss"),
  consentRequired: boolean("consentRequired").notNull().default(false),
  consentText: text("consentText"),
  allowFileUpload: boolean("allowFileUpload").notNull().default(false),
  maxFileSizeMb: integer("maxFileSizeMb").notNull().default(5),
  allowedFileTypes: jsonb("allowedFileTypes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // Widget presentation (drives the embed snippet + live preview).
  widgetType: text("widgetType").notNull().default("popup"),
  position: text("position").notNull().default("bottom-right"),
  buttonText: text("buttonText").notNull().default("Chat with us"),
  // Popup panel size in px, passed to the embed loader as data attributes.
  widgetWidth: integer("widgetWidth").notNull().default(400),
  widgetHeight: integer("widgetHeight").notNull().default(640),
  greeting: text("greeting"),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
});

// One row per chat session (not per message): anonymous session id plus the
// metadata analytics + security need -- ip, geo country, and the browser/os/
// device parsed from the user agent. No message text. Upserted on each message,
// bumping the message counter and lastSeenAt.
export const chatSession = pgTable(
  "chatSession",
  {
    id: text("id").primaryKey().$defaultFn(uid),
    botId: text("botId").notNull().references(() => bot.id, { onDelete: "cascade" }),
    sessionId: text("sessionId").notNull(),
    ip: text("ip"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    browser: text("browser"),
    os: text("os"),
    device: text("device"),
    // Lead capture: stored on the session (not just forwarded to n8n) so the
    // Sessions view can show who is chatting. Null on anonymous bots.
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    messages: integer("messages").notNull().default(0),
    createdAt: ts("createdAt").notNull().$defaultFn(now),
    lastSeenAt: ts("lastSeenAt").notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("chatsession_bot_session_idx").on(t.botId, t.sessionId), index("chatsession_created_idx").on(t.createdAt)],
);

// Org-scoped IP bans. A banned ip is rejected at the chat gateway before any
// work is done. Managed from the Security page or the analytics session list.
export const ipBan = pgTable(
  "ipBan",
  {
    id: text("id").primaryKey().$defaultFn(uid),
    organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
    ip: text("ip").notNull(),
    reason: text("reason"),
    createdAt: ts("createdAt").notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("ipban_org_ip_idx").on(t.organizationId, t.ip)],
);

export const apiKey = pgTable("apiKey", {
  id: text("id").primaryKey().$defaultFn(uid),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hashedKey: text("hashedKey").notNull().unique(),
  prefix: text("prefix").notNull(),
  createdAt: ts("createdAt").notNull().$defaultFn(now),
  lastUsedAt: ts("lastUsedAt"),
});