import { pgTable, text, timestamp, json, index } from "drizzle-orm/pg-core";

// Used by connect-pg-simple
export const sessionsTable = pgTable(
  "session",
  {
    sid: text("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6, withTimezone: false }).notNull(),
  },
  (t) => ({
    expireIdx: index("IDX_session_expire").on(t.expire),
  }),
);
