import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Core Auth ────────────────────────────────────────────────────────────────

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

// ─── Companies (bail bond agencies) ──────────────────────────────────────────

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  ownerName: varchar("ownerName", { length: 200 }),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }).default("LA"),
  // Subscription
  subscriptionTier: mysqlEnum("subscriptionTier", ["trial", "starter", "pro", "agency"]).default("trial").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "cancelled", "past_due"]).default("active").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  // Voice agent
  voiceProvider: varchar("voiceProvider", { length: 50 }),
  transferPhone: varchar("transferPhone", { length: 20 }),
  minimumBudgetThreshold: decimal("minimumBudgetThreshold", { precision: 10, scale: 2 }).default("100"),
  // Billing
  stripeCustomerId: varchar("stripeCustomerId", { length: 200 }),
  apiKey: varchar("apiKey", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ─── Voice Agent Configurations ───────────────────────────────────────────────

export const voiceAgentConfigs = mysqlTable("voice_agent_configs", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  systemPrompt: text("systemPrompt"),
  greetingMessage: text("greetingMessage"),
  qualificationMessageTemplate: text("qualificationMessageTemplate"),
  disqualificationMessageTemplate: text("disqualificationMessageTemplate"),
  maxCallDurationSeconds: int("maxCallDurationSeconds").default(300),
  enablePaymentPlans: boolean("enablePaymentPlans").default(true),
  paymentPlanMinimumPercent: decimal("paymentPlanMinimumPercent", { precision: 3, scale: 2 }).default("0.50"),
  transferOnQualified: boolean("transferOnQualified").default(true),
  transferDelaySeconds: int("transferDelaySeconds").default(3),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VoiceAgentConfig = typeof voiceAgentConfigs.$inferSelect;

// ─── Voice API Calls (audit trail) ───────────────────────────────────────────

export const voiceApiCalls = mysqlTable("voice_api_calls", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  // Request
  callerName: varchar("callerName", { length: 200 }),
  inmateNameSearched: varchar("inmateNameSearched", { length: 200 }),
  parish: varchar("parish", { length: 100 }),
  callerBudgetAvailable: decimal("callerBudgetAvailable", { precision: 10, scale: 2 }),
  // Results
  found: boolean("found"),
  inmateNameConfirmed: varchar("inmateNameConfirmed", { length: 200 }),
  bookingNumber: varchar("bookingNumber", { length: 100 }),
  totalBondAmount: decimal("totalBondAmount", { precision: 10, scale: 2 }),
  calculatedPremium: decimal("calculatedPremium", { precision: 10, scale: 2 }),
  screenerDecision: mysqlEnum("screenerDecision", [
    "QUALIFIED",
    "UNQUALIFIED",
    "NEEDS_MANUAL_REVIEW",
    "PAYMENT_PLAN_ELIGIBLE",
    "NOT_FOUND",
    "ERROR",
  ]),
  bondStatus: varchar("bondStatus", { length: 100 }),
  charges: text("charges"), // JSON array stored as text
  // Performance
  responseTimeMs: int("responseTimeMs"),
  dataSource: mysqlEnum("dataSource", ["real-time", "cache", "fallback", "mock"]).default("real-time"),
  scrapedAt: timestamp("scrapedAt"),
  // Voice agent metadata
  voiceProvider: varchar("voiceProvider", { length: 50 }),
  callId: varchar("callId", { length: 200 }),
  sessionId: varchar("sessionId", { length: 200 }),
  voicePromptSuggestion: text("voicePromptSuggestion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceApiCall = typeof voiceApiCalls.$inferSelect;
export type InsertVoiceApiCall = typeof voiceApiCalls.$inferInsert;

// ─── Voice Calls (recordings + transcripts) ───────────────────────────────────

export const voiceCalls = mysqlTable("voice_calls", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  apiCallId: int("apiCallId"),
  // Call metadata
  callId: varchar("callId", { length: 200 }),
  callerPhone: varchar("callerPhone", { length: 20 }),
  calledPhone: varchar("calledPhone", { length: 20 }),
  callStartedAt: timestamp("callStartedAt"),
  callEndedAt: timestamp("callEndedAt"),
  callDurationSeconds: int("callDurationSeconds"),
  // AI analysis
  callSummary: text("callSummary"),
  transcript: text("transcript"), // JSON array stored as text
  recordingUrl: varchar("recordingUrl", { length: 500 }),
  // Business outcome
  transferAttempted: boolean("transferAttempted").default(false),
  transferSuccessful: boolean("transferSuccessful"),
  transferredToAgent: varchar("transferredToAgent", { length: 200 }),
  // Quality
  sentimentScore: decimal("sentimentScore", { precision: 3, scale: 2 }),
  callerSatisfaction: mysqlEnum("callerSatisfaction", ["satisfied", "neutral", "frustrated"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceCall = typeof voiceCalls.$inferSelect;
export type InsertVoiceCall = typeof voiceCalls.$inferInsert;

// ─── API Usage Tracking ───────────────────────────────────────────────────────

export const apiUsage = mysqlTable("api_usage", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
  endpoint: varchar("endpoint", { length: 100 }),
  success: boolean("success"),
  responseTimeMs: int("responseTimeMs"),
  billingPeriod: varchar("billingPeriod", { length: 7 }), // "2026-03"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiUsage = typeof apiUsage.$inferSelect;

// ─── Roster Cache ─────────────────────────────────────────────────────────────

export const rosterCache = mysqlTable("roster_cache", {
  id: int("id").autoincrement().primaryKey(),
  parish: varchar("parish", { length: 100 }).notNull(),
  inmateName: varchar("inmateName", { length: 200 }).notNull(),
  inmateData: text("inmateData").notNull(), // JSON
  cachedAt: timestamp("cachedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  parishNameUnique: uniqueIndex("roster_cache_parish_name_unique").on(table.parish, table.inmateName),
}));

export type RosterCache = typeof rosterCache.$inferSelect;

// ─── Existing tables (unchanged) ──────────────────────────────────────────────

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

export const bondChanges = mysqlTable("bond_changes", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  previousAmount: decimal("previousAmount", { precision: 12, scale: 2 }),
  newAmount: decimal("newAmount", { precision: 12, scale: 2 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type BondChange = typeof bondChanges.$inferSelect;
export type InsertBondChange = typeof bondChanges.$inferInsert;

export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  hash: varchar("hash", { length: 64 }).notNull(),
  recordCount: int("recordCount").notNull().default(0),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

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
