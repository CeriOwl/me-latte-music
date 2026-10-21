import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, anonymous, username } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  // Staff only: customers use anonymous sessions, and staff accounts are
  // created by the seed script, so public sign-up stays closed.
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  plugins: [anonymous(), username(), admin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
