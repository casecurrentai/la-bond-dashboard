import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getAllSources,
  getBookings,
  getBookingById,
  getDashboardStats,
  getRecentBondChanges,
  getRecentScrapeLogs,
  getSourceByParish,
  insertBondChange,
  insertScrapeLog,
  insertSnapshot,
  markInactiveBookings,
  updateSourceAfterScrape,
  upsertBooking,
  upsertSource,
} from "./db";
import { getAdapterList, scrapeParish, scrapeAllParishes } from "./adapters";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return getDashboardStats();
    }),
  }),

  // ─── Sources ────────────────────────────────────────────────────────────────
  sources: router({
    list: publicProcedure.query(async () => {
      return getAllSources();
    }),
    adapters: publicProcedure.query(() => {
      return getAdapterList();
    }),
  }),

  // ─── Bookings ───────────────────────────────────────────────────────────────
  bookings: router({
    list: publicProcedure
      .input(
        z.object({
          parish: z.string().optional(),
          limit: z.number().min(1).max(200).optional().default(50),
          offset: z.number().min(0).optional().default(0),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return getBookings(input);
      }),
    search: publicProcedure
      .input(z.object({ name: z.string().min(1) }))
      .query(async ({ input }) => {
        return getBookings({ search: input.name, limit: 100 });
      }),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBookingById(input.id);
      }),
  }),

  // ─── Bond Changes ──────────────────────────────────────────────────────────
  bonds: router({
    recentChanges: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional().default(20) }))
      .query(async ({ input }) => {
        return getRecentBondChanges(input.limit);
      }),
  }),

  // ─── Scrape Logs ───────────────────────────────────────────────────────────
  logs: router({
    recent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(200).optional().default(50) }))
      .query(async ({ input }) => {
        return getRecentScrapeLogs(input.limit);
      }),
  }),

  // ─── Scrape Actions ────────────────────────────────────────────────────────
  scrape: router({
    parish: publicProcedure
      .input(z.object({ parish: z.string() }))
      .mutation(async ({ input }) => {
        return runScrapeForParish(input.parish);
      }),
    all: publicProcedure.mutation(async () => {
      const adapters = getAdapterList();
      const results = [];
      for (const adapter of adapters) {
        try {
          const result = await runScrapeForParish(adapter.parish);
          results.push(result);
        } catch (err: any) {
          results.push({
            parish: adapter.parish,
            status: "error",
            error: err.message,
            newBookings: 0,
            bondChanges: 0,
            recordCount: 0,
          });
        }
      }
      return results;
    }),
  }),
});

// ─── Scrape orchestration ──────────────────────────────────────────────────────

async function runScrapeForParish(parish: string) {
  const startTime = Date.now();

  // Ensure source exists
  const adapterList = getAdapterList();
  const adapterInfo = adapterList.find(
    (a) => a.parish.toLowerCase() === parish.toLowerCase()
  );
  if (!adapterInfo) {
    throw new Error(`No adapter for parish: ${parish}`);
  }

  await upsertSource({
    parish: adapterInfo.parish,
    sourceUrl: adapterInfo.baseUrl,
    sourceType: "sheriff_roster",
    isActive: true,
    pollIntervalMinutes: 30,
  });

  try {
    const result = await scrapeParish(parish);
    const source = await getSourceByParish(parish);
    const sourceId = source?.id ?? 0;

    // Save snapshot
    await insertSnapshot({
      sourceId,
      hash: result.hash,
      recordCount: result.bookings.length,
    });

    let newBookings = 0;
    let bondChangeCount = 0;

    // Upsert each booking
    for (const b of result.bookings) {
      const upsertResult = await upsertBooking({
        sourceId,
        parish: b.parish,
        externalBookingId: b.bookingId,
        name: b.name,
        age: b.age,
        bookingTime: b.bookingTime,
        bondText: b.bondText,
        bondAmount: b.bondAmount != null ? String(b.bondAmount) : null,
        chargesText: b.charges.join("\n"),
        isActive: true,
      });

      if (upsertResult.isNew) newBookings++;
      if (upsertResult.bondChanged) {
        bondChangeCount++;
        // Get the booking ID for the bond change record
        const booking = await getBookingById(
          // We need to find the booking by external ID
          0 // placeholder, we'll use a different approach
        );
      }
    }

    // Mark bookings not in the current scrape as inactive
    const activeIds = result.bookings.map((b) => b.bookingId);
    if (activeIds.length > 0) {
      await markInactiveBookings(parish, activeIds);
    }

    // Update source
    await updateSourceAfterScrape(parish, {
      recordCount: result.bookings.length,
    });

    // Log the scrape
    const durationMs = Date.now() - startTime;
    await insertScrapeLog({
      sourceId,
      parish,
      status: "success",
      recordCount: result.bookings.length,
      newBookings,
      bondChanges: bondChangeCount,
      durationMs,
    });

    return {
      parish,
      status: "success",
      recordCount: result.bookings.length,
      newBookings,
      bondChanges: bondChangeCount,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const source = await getSourceByParish(parish);

    await updateSourceAfterScrape(parish, {
      recordCount: 0,
      error: err.message,
    });

    await insertScrapeLog({
      sourceId: source?.id ?? 0,
      parish,
      status: "error",
      recordCount: 0,
      newBookings: 0,
      bondChanges: 0,
      durationMs,
      error: err.message,
    });

    throw err;
  }
}

export type AppRouter = typeof appRouter;
