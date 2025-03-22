import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse, generateWeeklySummary } from "./openai";
import { insertEntrySchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { setupScheduler } from "./scheduler";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup weekly summary scheduler
  setupScheduler(storage);
  
  // API Routes
  
  // Get all entries (most recent first)
  app.get("/api/entries", async (_req: Request, res: Response) => {
    try {
      const entries = await storage.getEntries();
      return res.json({ entries });
    } catch (error) {
      console.error("Error fetching entries:", error);
      return res.status(500).json({ message: "Failed to fetch entries" });
    }
  });
  
  // Create a new check-in entry
  app.post("/api/check-in", async (req: Request, res: Response) => {
    try {
      // Validate user input
      const taskSchema = z.object({
        task: z.string().min(1).max(60)
      });
      
      const { task } = taskSchema.parse(req.body);
      
      // Get user settings for AI tone
      const settings = await storage.getSettings();
      
      // Generate AI response
      const aiResponse = await generateAIResponse(task, settings.aiTone);
      
      // Create new entry
      const newEntry = await storage.createEntry({
        task,
        aiResponse,
        completed: false
      });
      
      return res.status(201).json({ entry: newEntry });
    } catch (error) {
      console.error("Error creating check-in:", error);
      
      if (error instanceof ZodError || error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input. Task must be between 1-60 characters." });
      }
      
      return res.status(500).json({ message: "Failed to create check-in" });
    }
  });
  
  // Mark an entry as completed
  app.patch("/api/entries/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      
      const updatedEntry = await storage.markEntryCompleted(id);
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      return res.json({ entry: updatedEntry });
    } catch (error) {
      console.error("Error completing entry:", error);
      return res.status(500).json({ message: "Failed to mark entry as completed" });
    }
  });
  
  // Get current weekly summary
  app.get("/api/summary", async (_req: Request, res: Response) => {
    try {
      const summary = await storage.getCurrentWeeklySummary();
      
      // If no summary exists, generate one on-the-fly
      if (!summary) {
        // Get entries from the current week
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
        const entries = await storage.getEntriesInDateRange(startOfWeek, endOfWeek);
        
        if (entries.length === 0) {
          return res.json({ summary: null });
        }
        
        // Generate summary
        const { achievements, patterns, themes } = await generateWeeklySummary(entries);
        
        // Create and save the summary
        const newSummary = await storage.createSummary({
          achievements,
          patterns,
          themes,
          weekStarting: startOfWeek
        });
        
        return res.json({ summary: newSummary });
      }
      
      return res.json({ summary });
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      return res.status(500).json({ message: "Failed to fetch weekly summary" });
    }
  });
  
  // Get user settings
  app.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      return res.json({ settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Update user settings
  app.patch("/api/settings", async (req: Request, res: Response) => {
    try {
      const updatedSettings = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(updatedSettings);
      return res.json({ settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      
      if (error instanceof ZodError || error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      
      return res.status(500).json({ message: "Failed to update settings" });
    }
  });

  return httpServer;
}
