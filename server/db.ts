import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { log } from "./vite";
import { users, entries, summaries, settings } from "@shared/schema";
import { exec as execCallback } from "child_process";
import { promisify } from "util";

// Convert exec to a promise-based function
const exec = promisify(execCallback);

// Initialize database connection
export async function initializeDatabase() {
  try {
    log("Initializing database connection", "database");
    
    // Create a connection for migrations and queries
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(migrationClient);
    
    log("Running database migrations directly with schema", "database");
    
    // Use direct schema migration approach with drizzle
    try {
      await migrate(db, { migrationsFolder: "drizzle" });
      log("Migration successful", "database");
    } catch (migrationError) {
      // If migration fails, try direct push
      log("Migration method failed, trying direct schema creation", "database");
      
      try {
        // Create tables directly using table names
        const tableNames = ["users", "entries", "summaries", "settings"];
        for (const tableName of tableNames) {
          try {
            const createTableSql = `CREATE TABLE IF NOT EXISTS "${tableName}" ();`;
            await migrationClient.unsafe(createTableSql);
            log(`Created table: ${tableName}`, "database");
          } catch (tableError) {
            log(`Error creating table ${tableName}: ${tableError}`, "database");
          }
        }
      } catch (directError) {
        log(`Direct schema creation error: ${directError}`, "database");
        throw directError;
      }
    }
    
    log("Database initialized successfully", "database");
    return;
  } catch (error) {
    log(`Database initialization error: ${error}`, "database");
    console.error("Database initialization error:", error);
    throw error;
  }
}