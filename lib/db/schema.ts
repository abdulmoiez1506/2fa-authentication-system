import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'verification', 'password-reset', 'login'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  otps: many(otps),
}))

export const otpsRelations = relations(otps, ({ one }) => ({
  user: one(users, {
    fields: [otps.email],
    references: [users.email],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type OTP = typeof otps.$inferSelect
export type NewOTP = typeof otps.$inferInsert
