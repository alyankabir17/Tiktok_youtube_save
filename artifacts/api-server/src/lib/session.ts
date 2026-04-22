import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@workspace/db";

const PgStore = connectPg(session);

const SESSION_SECRET = process.env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: false,
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
});

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
