import { pgTable, text, timestamp, uuid, integer, bigint, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const downloadHistoryTable = pgTable(
  "download_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    originalUrl: text("original_url").notNull(),
    videoTitle: text("video_title"),
    thumbnailUrl: text("thumbnail_url"),
    duration: integer("duration"),
    format: text("format").notNull(),
    quality: text("quality"),
    fileSize: bigint("file_size", { mode: "number" }),
    downloadedAt: timestamp("downloaded_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    status: text("status").default("completed").notNull(),
  },
  (t) => ({
    userIdx: index("idx_history_user_id").on(t.userId),
    dateIdx: index("idx_history_downloaded_at").on(t.downloadedAt),
    platformIdx: index("idx_history_platform").on(t.platform),
  }),
);

export type DownloadHistory = typeof downloadHistoryTable.$inferSelect;
export type InsertDownloadHistory = typeof downloadHistoryTable.$inferInsert;
