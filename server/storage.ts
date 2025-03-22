import { 
  Entry, InsertEntry, 
  Summary, InsertSummary,
  Setting, InsertSetting
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Entries
  getEntries(): Promise<Entry[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  getEntryById(id: number): Promise<Entry | undefined>;
  markEntryCompleted(id: number): Promise<Entry | undefined>;
  getEntriesInDateRange(startDate: Date, endDate: Date): Promise<Entry[]>;
  
  // Summaries
  getCurrentWeeklySummary(): Promise<Summary | undefined>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  
  // Settings
  getSettings(): Promise<Setting>;
  updateSettings(settings: InsertSetting): Promise<Setting>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private entries: Map<number, Entry>;
  private summaries: Map<number, Summary>;
  private userSettings: Setting;
  private entryIdCounter: number;
  private summaryIdCounter: number;
  
  constructor() {
    this.entries = new Map();
    this.summaries = new Map();
    this.entryIdCounter = 1;
    this.summaryIdCounter = 1;
    
    // Initialize with default settings
    this.userSettings = {
      id: 1,
      reminderTime: "09:00",
      pushNotifications: true,
      weeklySummary: true,
      aiTone: "motivational"
    };
  }
  
  // Entries
  async getEntries(): Promise<Entry[]> {
    return Array.from(this.entries.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createEntry(entry: InsertEntry): Promise<Entry> {
    const id = this.entryIdCounter++;
    const newEntry: Entry = {
      ...entry,
      id,
      date: new Date()
    };
    
    this.entries.set(id, newEntry);
    return newEntry;
  }
  
  async getEntryById(id: number): Promise<Entry | undefined> {
    return this.entries.get(id);
  }
  
  async markEntryCompleted(id: number): Promise<Entry | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry: Entry = {
      ...entry,
      completed: true
    };
    
    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async getEntriesInDateRange(startDate: Date, endDate: Date): Promise<Entry[]> {
    return Array.from(this.entries.values())
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Summaries
  async getCurrentWeeklySummary(): Promise<Summary | undefined> {
    // Get the summary for the current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    return Array.from(this.summaries.values())
      .find(summary => {
        const summaryDate = new Date(summary.weekStarting);
        return summaryDate.getTime() === startOfWeek.getTime();
      });
  }
  
  async createSummary(summary: InsertSummary): Promise<Summary> {
    const id = this.summaryIdCounter++;
    const newSummary: Summary = {
      ...summary,
      id
    };
    
    this.summaries.set(id, newSummary);
    return newSummary;
  }
  
  // Settings
  async getSettings(): Promise<Setting> {
    return this.userSettings;
  }
  
  async updateSettings(settings: InsertSetting): Promise<Setting> {
    this.userSettings = {
      ...this.userSettings,
      ...settings
    };
    
    return this.userSettings;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
