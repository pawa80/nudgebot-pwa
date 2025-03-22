import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Daily challenge entries
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  task: text("task").notNull(),
  aiResponse: text("ai_response").notNull(),
  completed: boolean("completed").default(false).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertEntrySchema = createInsertSchema(entries).pick({
  task: true,
  aiResponse: true,
  completed: true,
});

// Weekly summaries
export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  achievements: text("achievements").notNull(),
  patterns: text("patterns").notNull(),
  themes: text("themes").notNull(),
  weekStarting: timestamp("week_starting").notNull(),
});

export const insertSummarySchema = createInsertSchema(summaries).pick({
  achievements: true,
  patterns: true,
  themes: true,
  weekStarting: true,
});

// User settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  reminderTime: text("reminder_time").default("09:00").notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  weeklySummary: boolean("weekly_summary").default(true).notNull(),
  aiTone: text("ai_tone").default("motivational").notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  reminderTime: true,
  pushNotifications: true,
  weeklySummary: true,
  aiTone: true,
});

// Types
export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;

export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

// Request and Response Types
export type CheckInRequest = {
  task: string;
};

export type CheckInResponse = {
  entry: Entry;
};

export type GetEntriesResponse = {
  entries: Entry[];
};

export type GetSummaryResponse = {
  summary: Summary | null;
};

export type UpdateSettingsRequest = InsertSetting;

export type UpdateSettingsResponse = {
  settings: Setting;
};

export type GetSettingsResponse = {
  settings: Setting;
};
