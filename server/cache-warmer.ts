/**
 * BondCurrent — Background Cache Warmer
 *
 * Runs at server startup and every 30 minutes to pre-populate the DB cache
 * with inmate data from parishes that require Playwright (St. John the Baptist).
 *
 * This ensures screener lookups are instant (served from cache) rather than
 * waiting 15–30 seconds for a live Playwright scrape.
 */

import { getDb } from "./db";
import { rosterCache } from "../drizzle/schema";
import { scrapeStJohnAll } from "./adapters/st-john-zuercher";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function warmStJohnCache(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[CacheWarmer] No DB connection — skipping St. John cache warm");
    return;
  }

  const start = Date.now();
  console.log("[CacheWarmer] Warming St. John the Baptist cache via Zuercher Portal...");

  try {
    const bookings = await scrapeStJohnAll();
    const now = new Date();
    const expires = new Date(now.getTime() + CACHE_TTL_MS);

    let inserted = 0;
    for (const booking of bookings) {
      try {
        await db
          .insert(rosterCache)
          .values({
            parish: "St. John the Baptist",
            inmateName: booking.name,
            inmateData: JSON.stringify({
              name: booking.name,
              bookingNumber: booking.bookingId,
              parish: "St. John the Baptist",
              bondAmount: booking.bondAmount,
              bondText: booking.bondText,
              charges: booking.charges,
              bookingDate: booking.bookingTime,
              age: booking.age,
              race: (booking as any).rawData?.race ?? null,
              sex: (booking as any).rawData?.sex ?? null,
            }),
            cachedAt: now,
            expiresAt: expires,
          })
          .onDuplicateKeyUpdate({
            set: {
              inmateData: JSON.stringify({
                name: booking.name,
                bookingNumber: booking.bookingId,
                parish: "St. John the Baptist",
                bondAmount: booking.bondAmount,
                bondText: booking.bondText,
                charges: booking.charges,
                bookingDate: booking.bookingTime,
                age: booking.age,
              }),
              cachedAt: now,
              expiresAt: expires,
            },
          });
        inserted++;
      } catch (err) {
        // Individual insert failure — log and continue
        console.warn(`[CacheWarmer] Failed to cache ${booking.name}:`, (err as Error).message);
      }
    }

    const durationMs = Date.now() - start;
    console.log(
      `[CacheWarmer] St. John cache warmed: ${inserted}/${bookings.length} inmates cached in ${durationMs}ms`
    );
  } catch (err) {
    console.error("[CacheWarmer] St. John cache warm failed:", (err as Error).message);
  }
}

/**
 * Start the background cache warmer.
 * Runs immediately on startup, then every 30 minutes.
 */
export function startCacheWarmer(): void {
  // Run immediately at startup (with a short delay to let the server finish starting)
  setTimeout(() => {
    warmStJohnCache().catch((err) =>
      console.error("[CacheWarmer] Startup warm failed:", err.message)
    );
  }, 5000); // 5 second delay after server start

  // Then run every 30 minutes
  setInterval(() => {
    warmStJohnCache().catch((err) =>
      console.error("[CacheWarmer] Scheduled warm failed:", err.message)
    );
  }, CACHE_TTL_MS);

  console.log("[CacheWarmer] Background cache warmer started (St. John: every 30 min)");
}
