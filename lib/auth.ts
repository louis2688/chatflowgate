import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "./db";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: "ChatFlowGate",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  user: { deleteUser: { enabled: true } },
  ...(google ? { socialProviders: google } : {}),
  // Same email via password + Google links to one account (Google verifies email).
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  plugins: [
    organization(),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;