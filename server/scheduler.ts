import { IStorage } from "./storage";
import { generateWeeklySummary } from "./openai";

// Simple scheduler to generate weekly summaries
export function setupScheduler(storage: IStorage) {
  // Check once per day if we need to generate a weekly summary
  const dailyCheck = setInterval(async () => {
    try {
      // Only run on Sundays to generate the previous week's summary
      const today = new Date();
      if (today.getDay() !== 0) {
        return; // Not Sunday, skip
      }
      
      // Check if we already have a summary for this week
      const existingSummary = await storage.getCurrentWeeklySummary();
      if (existingSummary) {
        return; // Summary already exists
      }
      
      // Get all entries from the previous week
      const endOfWeek = new Date();
      endOfWeek.setHours(0, 0, 0, 0);
      
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(endOfWeek.getDate() - 7); // 7 days ago
      
      const entries = await storage.getEntriesInDateRange(startOfWeek, endOfWeek);
      
      if (entries.length === 0) {
        return; // No entries to summarize
      }
      
      // Generate the summary
      const { achievements, patterns, themes } = await generateWeeklySummary(entries);
      
      // Save the summary
      await storage.createSummary({
        achievements,
        patterns,
        themes,
        weekStarting: startOfWeek
      });
      
      console.log("Weekly summary generated successfully");
    } catch (error) {
      console.error("Error generating weekly summary:", error);
    }
  }, 86400000); // Check once per day (24 hours)
  
  // Clean up on process exit
  process.on("exit", () => {
    clearInterval(dailyCheck);
  });
}
