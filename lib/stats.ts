import { sql } from "drizzle-orm";
import { db } from "./db";

// Live usage counters for the landing page. The numbers are read from the
// database, never typed in by hand, so the page can only ever state what is
// actually true.
//
// Below these thresholds the counter hides itself rather than advertising a
// small number. It switches on by itself once the product has the traction to
// back it up -- no code change and no temptation to round upwards.
const MIN_WORKSPACES = 25;
const MIN_MESSAGES = 1_000;

export type PublicStats = { workspaces: number; messages: number } | null;

export async function publicStats(): Promise<PublicStats> {
  try {
    const [row] = (await db.execute(sql`
      select
        (select count(*) from "organization")::int as workspaces,
        (select coalesce(sum("messages"), 0) from "chatSession")::int as messages
    `)) as unknown as Array<{ workspaces: number; messages: number }>;
    if (!row) return null;
    const workspaces = Number(row.workspaces) || 0;
    const messages = Number(row.messages) || 0;
    if (workspaces < MIN_WORKSPACES || messages < MIN_MESSAGES) return null;
    return { workspaces, messages };
  } catch {
    return null; // a stats hiccup must never take the landing page down
  }
}
