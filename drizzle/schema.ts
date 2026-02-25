import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Parish data sources — one row per parish adapter.
 */
export const sources = mysqlTable("sources", {
  id: int("id").autoincrement().primaryKey(),
  parish: varchar("parish", { length: 100 }).notNull().unique(),
  sourceUrl: text("sourceUrl").notNull(),
  sourceType: varchar("sourceType", { length: 50 }).notNull().default("sheriff_roster"),
  isActive: boolean("isActive").notNull().default(true),
  pollIntervalMinutes: int("pollIntervalMinutes").notNull().default(30),
  lastPolledAt: timestamp("lastPolledAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastError: text("lastError"),
  recordCount: int("recordCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;

/**
 * Booking records scraped from parish rosters.
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  parish: varchar("parish", { length: 100 }).notNull(),
  externalBookingId: varchar("externalBookingId", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  age: int("age"),
  bookingTime: varchar("bookingTime", { length: 100 }),
  bondText: text("bondText"),
  bondAmount: decimal("bondAmount", { precision: 12, scale: 2 }),
  chargesText: text("chargesText"),
  isActive: boolean("isActive").notNull().default(true),
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Bond change history — tracks when bond amounts change for a booking.
 */
export const bondChanges = mysqlTable("bond_changes", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  previousAmount: decimal("previousAmount", { precision: 12, scale: 2 }),
  newAmount: decimal("newAmount", { precision: 12, scale: 2 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type BondChange = typeof bondChanges.$inferSelect;
export type InsertBondChange = typeof bondChanges.$inferInsert;

/**
 * Snapshot metadata — tracks HTML snapshots taken during each scrape.
 */
export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  hash: varchar("hash", { length: 64 }).notNull(),
  recordCount: int("recordCount").notNull().default(0),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

/**
 * Scrape log — tracks each scrape run for monitoring.
 */
export const scrapeLogs = mysqlTable("scrape_logs", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  parish: varchar("parish", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("success"),
  recordCount: int("recordCount").notNull().default(0),
  newBookings: int("newBookings").notNull().default(0),
  bondChanges: int("bondChanges").notNull().default(0),
  durationMs: int("durationMs"),
  error: text("error"),
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
});

export type ScrapeLog = typeof scrapeLogs.$inferSelect;
export type InsertScrapeLog = typeof scrapeLogs.$inferInsert;
