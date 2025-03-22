import { IStorage } from "./storage";
import { generateWeeklySummary } from "./openai";
import { log } from "./vite";

// Simple scheduler to generate weekly summaries for all users
export function setupScheduler(storage: IStorage) {
  // Check once per day if we need to generate a weekly summary
  const dailyCheck = setInterval(async () => {
    try {
      // Only run on Sundays to generate the previous week's summary
      const today = new Date();
      if (today.getDay() !== 0) {
        return; // Not Sunday, skip
      }
      
      log("Running weekly summary generation job", "scheduler");
      
      try {
        // Get all active users
        const users = await storage.getAllUsers();
        
        if (!users || users.length === 0) {
          log("No users found for weekly summary generation", "scheduler");
          return;
        }
        
        log(`Processing weekly summaries for ${users.length} users`, "scheduler");
        
        // Process each user
        for (const user of users) {
          try {
            // Get user settings to check if weekly summaries are enabled
            const settings = await storage.getSettings(user.id);
            
            if (!settings.weeklySummary) {
              log(`Weekly summaries disabled for user ${user.id}`, "scheduler");
              continue; // Skip this user
            }
            
            // Check if we already have a summary for this week for this user
            const existingSummary = await storage.getCurrentWeeklySummary(user.id);
            if (existingSummary) {
              log(`Summary already exists for user ${user.id}`, "scheduler");
              continue; // Summary already exists for this user
            }
            
            // Get entries from the previous week for this user
            const endOfWeek = new Date();
            endOfWeek.setHours(0, 0, 0, 0);
            
            const startOfWeek = new Date(endOfWeek);
            startOfWeek.setDate(endOfWeek.getDate() - 7); // 7 days ago
            
            const entries = await storage.getEntriesInDateRange(user.id, startOfWeek, endOfWeek);
            
            if (entries.length === 0) {
              log(`No entries for user ${user.id} to summarize`, "scheduler");
              continue; // No entries to summarize for this user
            }
            
            // Generate the summary
            log(`Generating summary for user ${user.id} with ${entries.length} entries`, "scheduler");
            const { achievements, patterns, themes } = await generateWeeklySummary(entries);
            
            // Save the summary
            await storage.createSummary({
              userId: user.id,
              achievements,
              patterns,
              themes,
              weekStarting: startOfWeek
            });
            
            log(`Weekly summary generated successfully for user ${user.id}`, "scheduler");
          } catch (userError) {
            log(`Error processing user ${user.id}: ${userError}`, "scheduler");
          }
        }
      } catch (usersError) {
        log(`Error fetching users: ${usersError}`, "scheduler");
      }
    } catch (error) {
      log(`Error in weekly summary scheduler: ${error}`, "scheduler");
      console.error("Error in weekly summary scheduler:", error);
    }
  }, 86400000); // Check once per day (24 hours)
  
  // For development, also check shortly after startup
  setTimeout(async () => {
    try {
      log("Running post-startup summary check", "scheduler");
      // Get all users who have the weeklySummary setting enabled
      // and generate summaries for them if needed
      const users = await storage.getAllUsers();
      
      if (!users || users.length === 0) {
        log("No users found for post-startup summary generation", "scheduler");
        return;
      }
      
      // Process a random user for testing
      if (users.length > 0) {
        const randomUser = users[0];
        log(`Testing summary generation for user ${randomUser.id}`, "scheduler");
        
        // Check their settings
        const settings = await storage.getSettings(randomUser.id);
        
        if (settings.weeklySummary) {
          // Generate a test summary
          const today = new Date();
          const endOfWeek = new Date(today);
          const startOfWeek = new Date(today);
          startOfWeek.setDate(endOfWeek.getDate() - 7);
          
          const entries = await storage.getEntriesInDateRange(randomUser.id, startOfWeek, endOfWeek);
          log(`Found ${entries.length} entries for test summary`, "scheduler");
          
          if (entries.length > 0) {
            // Generate a summary even if one exists (for testing)
            const { achievements, patterns, themes } = await generateWeeklySummary(entries);
            log(`Generated test summary successfully`, "scheduler");
          }
        }
      }
    } catch (error) {
      log(`Error in startup summary check: ${error}`, "scheduler");
    }
  }, 10000); // 10 seconds after startup
  
  // Clean up on process exit
  process.on("exit", () => {
    clearInterval(dailyCheck);
  });
}
