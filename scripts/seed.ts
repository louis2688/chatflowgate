import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { organization, bot } from "../lib/db/schema.ts";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const client = postgres(url!, { prepare: false });
const db = drizzle(client, { schema: { organization, bot } });
const webhook = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/mock/chat";

await db.insert(organization).values({ id: "demo-org", name: "ChatFlowGate Demo" }).onConflictDoNothing();

const existing = await db.query.bot.findFirst({ where: eq(bot.id, "demo") });
if (!existing) {
  await db.insert(bot).values({
    id: "demo",
    organizationId: "demo-org",
    name: "ChatFlowGate Support",
    welcome: "Hi! I'm ChatFlowGate Support. Ask me anything about your order, our products, or pricing.",
    color: "#1c69d4",
    suggestedPrompts: ["What can you do?", "Pricing plans", "Talk to a human"],
    webhookUrl: webhook,
    allowAnonymous: true,
    allowedOrigins: [],
  });
  console.log("seeded demo bot (id: demo) ->", webhook);
} else {
  console.log("demo bot already exists");
}
await client.end();
process.exit(0);
