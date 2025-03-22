import { 
  Entry, InsertEntry, 
  Summary, InsertSummary,
  Setting, InsertSetting,
  User, InsertUser,
  users, entries, summaries, settings
} from "@shared/schema";
import { eq, and, between, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";

// Connect to the database
const queryClient = postgres(process.env.DATABASE_URL!, { max: 1 });
// Initialize Drizzle ORM
const db = drizzle(queryClient);

// Storage interface
export interface IStorage {
  // Users
  createUser(username: string, email: string, password: string): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Entries
  getEntries(userId: number): Promise<Entry[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  getEntryById(id: number, userId: number): Promise<Entry | undefined>;
  markEntryCompleted(id: number, userId: number): Promise<Entry | undefined>;
  getEntriesInDateRange(userId: number, startDate: Date, endDate: Date): Promise<Entry[]>;
  
  // Summaries
  getCurrentWeeklySummary(userId: number): Promise<Summary | undefined>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  
  // Settings
  getSettings(userId: number): Promise<Setting>;
  updateSettings(userId: number, updatedSettings: Partial<Setting>): Promise<Setting>;
  
  // Data Export
  exportUserData(userId: number, format: 'json' | 'csv'): Promise<string>;
}

// PostgreSQL storage implementation
export class PostgresStorage implements IStorage {
  // Users
  async createUser(username: string, email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [newUser] = await db.insert(users)
      .values({
        username,
        email,
        passwordHash
      })
      .returning();
    
    // Create default settings for new user
    await db.insert(settings)
      .values({
        userId: newUser.id,
        reminderTime: "09:00",
        pushNotifications: true,
        weeklySummary: true,
        aiTone: "motivational"
      });
      
    return newUser;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    return results[0];
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const results = await db.select()
      .from(users)
      .where(eq(users.id, id));
    
    return results[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select()
      .from(users);
  }
  
  // Entries
  async getEntries(userId: number): Promise<Entry[]> {
    return db.select()
      .from(entries)
      .where(eq(entries.userId, userId))
      .orderBy(desc(entries.date));
  }
  
  async createEntry(entry: InsertEntry): Promise<Entry> {
    const [newEntry] = await db.insert(entries)
      .values(entry)
      .returning();
    
    return newEntry;
  }
  
  async getEntryById(id: number, userId: number): Promise<Entry | undefined> {
    const results = await db.select()
      .from(entries)
      .where(and(
        eq(entries.id, id),
        eq(entries.userId, userId)
      ));
    
    return results[0];
  }
  
  async markEntryCompleted(id: number, userId: number): Promise<Entry | undefined> {
    const [updatedEntry] = await db.update(entries)
      .set({ completed: true })
      .where(and(
        eq(entries.id, id),
        eq(entries.userId, userId)
      ))
      .returning();
    
    return updatedEntry;
  }
  
  async getEntriesInDateRange(userId: number, startDate: Date, endDate: Date): Promise<Entry[]> {
    return db.select()
      .from(entries)
      .where(and(
        eq(entries.userId, userId),
        between(entries.date, startDate, endDate)
      ))
      .orderBy(entries.date);
  }
  
  // Summaries
  async getCurrentWeeklySummary(userId: number): Promise<Summary | undefined> {
    // Get the summary for the current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const results = await db.select()
      .from(summaries)
      .where(and(
        eq(summaries.userId, userId),
        between(summaries.weekStarting, startOfWeek, endOfWeek)
      ));
    
    return results[0];
  }
  
  async createSummary(summary: InsertSummary): Promise<Summary> {
    const [newSummary] = await db.insert(summaries)
      .values(summary)
      .returning();
    
    return newSummary;
  }
  
  // Settings
  async getSettings(userId: number): Promise<Setting> {
    const results = await db.select()
      .from(settings)
      .where(eq(settings.userId, userId));
    
    if (results.length === 0) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(settings)
        .values({
          userId,
          reminderTime: "09:00",
          pushNotifications: true,
          weeklySummary: true,
          aiTone: "motivational"
        })
        .returning();
      
      return newSettings;
    }
    
    return results[0];
  }
  
  async updateSettings(userId: number, updatedSettings: Partial<Setting>): Promise<Setting> {
    // Ensure we're only updating allowed fields
    const settingsToUpdate: Partial<InsertSetting> = {
      userId
    };
    
    if (updatedSettings.reminderTime !== undefined) {
      settingsToUpdate.reminderTime = updatedSettings.reminderTime;
    }
    
    if (updatedSettings.pushNotifications !== undefined) {
      settingsToUpdate.pushNotifications = updatedSettings.pushNotifications;
    }
    
    if (updatedSettings.weeklySummary !== undefined) {
      settingsToUpdate.weeklySummary = updatedSettings.weeklySummary;
    }
    
    if (updatedSettings.aiTone !== undefined) {
      settingsToUpdate.aiTone = updatedSettings.aiTone;
    }
    
    // Check if settings exist
    const existingSettings = await this.getSettings(userId);
    
    if (!existingSettings) {
      // Create settings if they don't exist
      const [newSettings] = await db.insert(settings)
        .values({
          ...settingsToUpdate as InsertSetting
        })
        .returning();
      
      return newSettings;
    }
    
    // Update existing settings
    const [updatedSettingsResult] = await db.update(settings)
      .set(settingsToUpdate)
      .where(eq(settings.userId, userId))
      .returning();
    
    return updatedSettingsResult;
  }
  
  // Data Export
  async exportUserData(userId: number, format: 'json' | 'csv'): Promise<string> {
    // Get user entries and summaries
    const userEntries = await this.getEntries(userId);
    const userSettings = await this.getSettings(userId);
    
    if (format === 'json') {
      return JSON.stringify({
        entries: userEntries,
        settings: userSettings
      }, null, 2);
    } else {
      // CSV format
      const { stringify } = await import('csv-stringify/sync');
      
      // Convert entries to CSV
      const entriesCSV = stringify(userEntries.map(entry => ({
        id: entry.id,
        date: entry.date,
        task: entry.task,
        aiResponse: entry.aiResponse,
        completed: entry.completed ? 'Yes' : 'No'
      })), {
        header: true
      });
      
      return entriesCSV;
    }
  }
}

// Create and export storage instance
export const storage = new PostgresStorage();
