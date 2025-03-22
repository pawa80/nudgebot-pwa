import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse, generateWeeklySummary } from "./openai";
import { insertEntrySchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { setupScheduler } from "./scheduler";
import { register, login, logout, authenticate, getCurrentUser, getUserId } from "./auth";
import cookieParser from "cookie-parser";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup weekly summary scheduler
  setupScheduler(storage);
  
  // Middleware
  app.use(cookieParser());
  
  // Auth Routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", authenticate, getCurrentUser);
  
  // Protected API Routes
  
  // Get all entries (most recent first) for the current user
  app.get("/api/entries", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const entries = await storage.getEntries(userId);
      return res.json({ entries });
    } catch (error) {
      console.error("Error fetching entries:", error);
      return res.status(500).json({ message: "Failed to fetch entries" });
    }
  });
  
  // Create a new check-in entry
  app.post("/api/check-in", authenticate, async (req: Request, res: Response) => {
    try {
      // Validate user input
      const taskSchema = z.object({
        task: z.string().min(1).max(60)
      });
      
      const { task } = taskSchema.parse(req.body);
      const userId = getUserId(req);
      
      // Get user settings for AI tone
      const settings = await storage.getSettings(userId);
      
      // Generate AI response
      const aiResponse = await generateAIResponse(task, settings.aiTone);
      
      // Create new entry
      const newEntry = await storage.createEntry({
        userId,
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
  app.patch("/api/entries/:id/complete", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = getUserId(req);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      
      const updatedEntry = await storage.markEntryCompleted(id, userId);
      
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
  app.get("/api/summary", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const summary = await storage.getCurrentWeeklySummary(userId);
      
      // If no summary exists, generate one on-the-fly
      if (!summary) {
        // Get entries from the current week
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
        const entries = await storage.getEntriesInDateRange(userId, startOfWeek, endOfWeek);
        
        if (entries.length === 0) {
          return res.json({ summary: null });
        }
        
        // Generate summary
        const { achievements, patterns, themes } = await generateWeeklySummary(entries);
        
        // Create and save the summary
        const newSummary = await storage.createSummary({
          userId,
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
  app.get("/api/settings", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const settings = await storage.getSettings(userId);
      return res.json({ settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Update user settings
  app.patch("/api/settings", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { reminderTime, pushNotifications, weeklySummary, aiTone } = req.body;
      
      // Validate settings
      const settingsSchema = z.object({
        reminderTime: z.string().optional(),
        pushNotifications: z.boolean().optional(),
        weeklySummary: z.boolean().optional(),
        aiTone: z.string().optional()
      });
      
      const validatedSettings = settingsSchema.parse({
        reminderTime,
        pushNotifications,
        weeklySummary,
        aiTone
      });
      
      const settings = await storage.updateSettings(userId, validatedSettings);
      return res.json({ settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      
      if (error instanceof ZodError || error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      
      return res.status(500).json({ message: "Failed to update settings" });
    }
  });
  
  // Export user data
  app.post("/api/export", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { format = 'json' } = req.body;
      
      // Validate format
      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({ message: "Invalid format. Use 'json' or 'csv'." });
      }
      
      const data = await storage.exportUserData(userId, format as 'json' | 'csv');
      
      if (format === 'json') {
        return res.json({ data });
      } else {
        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="nudge-data.csv"');
        return res.send(data);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      return res.status(500).json({ message: "Failed to export data" });
    }
  });

  return httpServer;
}
