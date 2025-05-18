import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import { sql } from "drizzle-orm"

// Initialize the Neon client with the connection string
const sql_client = neon(process.env.DATABASE_URL!)

// Initialize Drizzle with the Neon client and schema
export const db = drizzle(sql_client, { schema })

// Database initialization function
export async function initDatabase() {
  try {
    console.log("Checking database tables...")

    // Check if users table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `)

    const exists = tableExists.rows[0]?.exists === true

    if (!exists) {
      console.log("Tables don't exist. Creating database schema...")

      // Create users table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Create otps table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS otps (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          type VARCHAR(20) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)

      console.log("Database schema created successfully!")
    } else {
      console.log("Database tables already exist.")
    }

    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}
