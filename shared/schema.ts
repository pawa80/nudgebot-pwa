import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("email_idx").on(table.email),
    usernameIdx: uniqueIndex("username_idx").on(table.username),
  }
});

export const usersRelations = relations(users, ({ many }) => ({
  entries: many(entries),
  summaries: many(summaries),
  settings: many(settings),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
});

// Daily challenge entries
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  task: text("task").notNull(),
  aiResponse: text("ai_response").notNull(),
  completed: boolean("completed").default(false).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const entriesRelations = relations(entries, ({ one }) => ({
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
}));

export const insertEntrySchema = createInsertSchema(entries).pick({
  userId: true,
  task: true,
  aiResponse: true,
  completed: true,
});

// Weekly summaries
export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievements: text("achievements").notNull(),
  patterns: text("patterns").notNull(),
  themes: text("themes").notNull(),
  weekStarting: timestamp("week_starting").notNull(),
});

export const summariesRelations = relations(summaries, ({ one }) => ({
  user: one(users, {
    fields: [summaries.userId],
    references: [users.id],
  }),
}));

export const insertSummarySchema = createInsertSchema(summaries).pick({
  userId: true,
  achievements: true,
  patterns: true,
  themes: true,
  weekStarting: true,
});

// User settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  reminderTime: text("reminder_time").default("09:00").notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  weeklySummary: boolean("weekly_summary").default(true).notNull(),
  aiTone: text("ai_tone").default("motivational").notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

export const insertSettingsSchema = createInsertSchema(settings).pick({
  userId: true,
  reminderTime: true,
  pushNotifications: true,
  weeklySummary: true,
  aiTone: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;

export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

// Request and Response Types
// Auth
export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: {
    id: number;
    username: string;
    email: string;
  };
};

export type ExportDataRequest = {
  format: 'json' | 'csv';
};

export type ExportDataResponse = {
  data: string;
};

// Entries
export type CheckInRequest = {
  task: string;
};

export type CheckInResponse = {
  entry: Entry;
};

export type GetEntriesResponse = {
  entries: Entry[];
};

// Summaries
export type GetSummaryResponse = {
  summary: Summary | null;
};

// Settings
export type UpdateSettingsRequest = {
  reminderTime?: string;
  pushNotifications?: boolean;
  weeklySummary?: boolean;
  aiTone?: string;
};

export type UpdateSettingsResponse = {
  settings: Setting;
};

export type GetSettingsResponse = {
  settings: Setting;
};
