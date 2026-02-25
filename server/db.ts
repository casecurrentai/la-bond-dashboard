import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  sources,
  bookings,
  bondChanges,
  snapshots,
  scrapeLogs,
  type InsertSource,
  type InsertBooking,
  type InsertBondChange,
  type InsertScrapeLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Source helpers ───────────────────────────────────────────────────────────

export async function upsertSource(data: InsertSource) {
  const db = await getDb();
  if (!db) return;
  await db.insert(sources).values(data).onDuplicateKeyUpdate({
    set: {
      sourceUrl: data.sourceUrl,
      sourceType: data.sourceType,
      isActive: data.isActive,
      pollIntervalMinutes: data.pollIntervalMinutes,
      updatedAt: new Date(),
    },
  });
}

export async function getAllSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sources).orderBy(sources.parish);
}

export async function getSourceByParish(parish: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sources).where(eq(sources.parish, parish)).limit(1);
  return result[0];
}

export async function updateSourceAfterScrape(
  parish: string,
  opts: { recordCount: number; error?: string }
) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  if (opts.error) {
    await db
      .update(sources)
      .set({ lastPolledAt: now, lastError: opts.error, updatedAt: now })
      .where(eq(sources.parish, parish));
  } else {
    await db
      .update(sources)
      .set({
        lastPolledAt: now,
        lastSuccessAt: now,
        recordCount: opts.recordCount,
        lastError: null,
        updatedAt: now,
      })
      .where(eq(sources.parish, parish));
  }
}

// ─── Booking helpers ─────────────────────────────────────────────────────────

export async function upsertBooking(data: InsertBooking): Promise<{ isNew: boolean; bondChanged: boolean; oldBondAmount: string | null }> {
  const db = await getDb();
  if (!db) return { isNew: true, bondChanged: false, oldBondAmount: null };

  const existing = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.parish, data.parish),
        eq(bookings.externalBookingId, data.externalBookingId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(bookings).values(data);
    return { isNew: true, bondChanged: false, oldBondAmount: null };
  }

  const old = existing[0];
  const oldBond = old.bondAmount;
  const newBond = data.bondAmount ?? null;
  const bondChanged = String(oldBond) !== String(newBond);

  await db
    .update(bookings)
    .set({
      name: data.name,
      age: data.age,
      bookingTime: data.bookingTime,
      bondText: data.bondText,
      bondAmount: data.bondAmount,
      chargesText: data.chargesText,
      isActive: true,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, old.id));

  return { isNew: false, bondChanged, oldBondAmount: oldBond };
}

export async function getBookings(opts: {
  parish?: string;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  if (opts.parish) conditions.push(eq(bookings.parish, opts.parish));
  if (opts.search) {
    conditions.push(sql`${bookings.name} LIKE ${`%${opts.search}%`}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(where)
      .orderBy(desc(bookings.lastSeenAt))
      .limit(opts.limit ?? 50)
      .offset(opts.offset ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(where),
  ]);

  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function markInactiveBookings(parish: string, activeIds: string[]) {
  const db = await getDb();
  if (!db) return;
  if (activeIds.length === 0) return;
  // Mark bookings not in the active list as inactive
  await db
    .update(bookings)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(bookings.parish, parish),
        eq(bookings.isActive, true),
        sql`${bookings.externalBookingId} NOT IN (${sql.join(
          activeIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
    );
}

// ─── Bond change helpers ─────────────────────────────────────────────────────

export async function insertBondChange(data: InsertBondChange) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bondChanges).values(data);
}

export async function getRecentBondChanges(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bondChanges.id,
      bookingId: bondChanges.bookingId,
      previousAmount: bondChanges.previousAmount,
      newAmount: bondChanges.newAmount,
      changedAt: bondChanges.changedAt,
      bookingName: bookings.name,
      parish: bookings.parish,
      externalBookingId: bookings.externalBookingId,
    })
    .from(bondChanges)
    .leftJoin(bookings, eq(bondChanges.bookingId, bookings.id))
    .orderBy(desc(bondChanges.changedAt))
    .limit(limit);
}

// ─── Snapshot helpers ────────────────────────────────────────────────────────

export async function insertSnapshot(data: { sourceId: number; hash: string; recordCount: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(snapshots).values(data);
}

// ─── Scrape log helpers ──────────────────────────────────────────────────────

export async function insertScrapeLog(data: InsertScrapeLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(scrapeLogs).values(data);
}

export async function getRecentScrapeLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scrapeLogs)
    .orderBy(desc(scrapeLogs.scrapedAt))
    .limit(limit);
}

// ─── Stats helpers ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db)
    return {
      totalBookings: 0,
      activeBookings: 0,
      totalBondValue: 0,
      avgBondAmount: 0,
      parishBreakdown: [],
      recentBookings: [],
    };

  const [totalResult, activeResult, bondResult, avgResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(bookings),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.isActive, true)),
    db
      .select({ total: sql<number>`COALESCE(SUM(CAST(bondAmount AS DECIMAL(12,2))), 0)` })
      .from(bookings)
      .where(eq(bookings.isActive, true)),
    db
      .select({ avg: sql<number>`COALESCE(AVG(CAST(bondAmount AS DECIMAL(12,2))), 0)` })
      .from(bookings)
      .where(and(eq(bookings.isActive, true), sql`bondAmount IS NOT NULL AND bondAmount > 0`)),
  ]);

  const parishBreakdown = await db
    .select({
      parish: bookings.parish,
      count: sql<number>`count(*)`,
      totalBond: sql<number>`COALESCE(SUM(CAST(bondAmount AS DECIMAL(12,2))), 0)`,
    })
    .from(bookings)
    .where(eq(bookings.isActive, true))
    .groupBy(bookings.parish);

  const recentBookings = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt))
    .limit(10);

  return {
    totalBookings: totalResult[0]?.count ?? 0,
    activeBookings: activeResult[0]?.count ?? 0,
    totalBondValue: bondResult[0]?.total ?? 0,
    avgBondAmount: avgResult[0]?.avg ?? 0,
    parishBreakdown,
    recentBookings,
  };
}
