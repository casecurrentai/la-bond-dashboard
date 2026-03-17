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
import { getAdapterList, scrapeParish, scrapeAllParishes, scrapeOrleans, scrapeJefferson } from "./adapters";

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
      .input(
        z.object({
          name: z.string().optional(),
          charge: z.string().optional(),
          parish: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const searchTerm = input.name || input.charge || "";
        if (!searchTerm) return { items: [], total: 0 };
        return getBookings({ search: searchTerm, parish: input.parish, limit: 100 });
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

  // ─── St. John Client-Side Screener ─────────────────────────────────────────
  // The Zuercher portal blocks server-side connections from datacenter IPs.
  // This endpoint accepts raw Zuercher data fetched client-side and processes
  // it into a screener result, including bond qualification logic.
  stjohn: router({
    screen: publicProcedure
      .input(z.object({
        inmate_name: z.string(),
        caller_budget: z.number().optional(),
        zuercher_records: z.array(z.object({
          name: z.string(),
          hold_reasons: z.string().optional().default(""),
          arrest_date: z.string().optional(),
          dob: z.number().optional(),
          race: z.string().optional(),
          sex: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { inmate_name, caller_budget, zuercher_records } = input;
        const nameParts = inmate_name.toUpperCase().replace(",", "").split(/\s+/).filter(Boolean);
        const lastName = inmate_name.includes(",")
          ? inmate_name.split(",")[0].trim().toUpperCase()
          : nameParts[nameParts.length - 1];

        // Find best match
        const match = zuercher_records.find(r =>
          r.name.toUpperCase().includes(lastName)
        );

        if (!match) {
          return {
            found: false,
            inmate_name_searched: inmate_name,
            parish: "St. John the Baptist",
            screener_decision: "NOT_FOUND" as const,
            voice_prompt_suggestion: `I searched the St. John the Baptist Parish jail roster but couldn't find anyone named ${inmate_name}. Could you verify the spelling of the name?`,
            jail_contact: {
              facility: "St. John the Baptist Parish Jail",
              booking_line: "(985) 652-6338",
              main_line: "(985) 652-6338",
              address: "1801 W. Airline Hwy, LaPlace, LA 70068",
              hours: "24/7",
            },
          };
        }

        // Parse bond from hold_reasons
        const holdText = match.hold_reasons || "";
        const bondMatch = holdText.match(/\$([\d,]+(?:\.\d{2})?)/i);
        const bondAmount = bondMatch ? parseFloat(bondMatch[1].replace(/,/g, "")) : null;
        const premiumRate = 0.10;
        const premium = bondAmount ? bondAmount * premiumRate : null;
        const budget = caller_budget ?? null;

        let decision: "QUALIFIED" | "UNQUALIFIED" | "NEEDS_MANUAL_REVIEW" | "PAYMENT_PLAN_ELIGIBLE";
        if (!bondAmount) {
          decision = "NEEDS_MANUAL_REVIEW";
        } else if (budget !== null && budget >= (premium ?? 0)) {
          decision = "QUALIFIED";
        } else if (budget !== null && budget >= (premium ?? 0) * 0.5) {
          decision = "PAYMENT_PLAN_ELIGIBLE";
        } else {
          decision = budget !== null ? "UNQUALIFIED" : "QUALIFIED";
        }

        // Parse charges
        const charges = holdText
          .split(/\n/)
          .map(l => l.replace(/Bond[^;]*/gi, "").replace(/\$[\d,.]+/g, "").trim())
          .filter(l => l.length > 3)
          .slice(0, 5);

        return {
          found: true,
          inmate_name_searched: inmate_name,
          parish: "St. John the Baptist",
          screener_decision: decision,
          inmate: {
            name: match.name,
            bookingNumber: `STJOHN-${match.arrest_date ?? "unknown"}-${match.name.replace(/\s+/g, "-").slice(0, 20)}`,
            parish: "St. John the Baptist",
            bondAmount,
            bondText: bondAmount ? `$${bondAmount.toLocaleString()}` : "No Bond / Not Set",
            charges,
            bookingDate: match.arrest_date ?? "",
            age: match.dob ?? null,
            race: match.race ?? null,
            sex: match.sex ?? null,
          },
          bond_amount: bondAmount,
          premium_amount: premium,
          premium_rate: premiumRate,
          data_source: "client-side-zuercher" as const,
          jail_contact: !bondAmount ? {
            facility: "St. John the Baptist Parish Jail",
            booking_line: "(985) 652-6338",
            main_line: "(985) 652-6338",
            address: "1801 W. Airline Hwy, LaPlace, LA 70068",
            hours: "24/7",
          } : undefined,
        };
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
      // Include Orleans and Jefferson as special adapters
      const allParishes = [
        ...adapters.map((a) => a.parish),
        "Orleans",
        "Jefferson",
      ];
      const results = [];
      for (const parish of allParishes) {
        try {
          const result = await runScrapeForParish(parish);
          results.push(result);
        } catch (err: any) {
          results.push({
            parish,
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

  // Special adapters for Orleans and Jefferson (not in the standard list)
  const SPECIAL_ADAPTERS: Record<string, { baseUrl: string; bondAvailable: boolean }> = {
    Orleans: { baseUrl: "https://www.opso.gov/", bondAvailable: false },
    Jefferson: { baseUrl: "https://apps.jpso.com/inmatesearch2/", bondAvailable: true },
  };

  // Ensure source exists
  const adapterList = getAdapterList();
  const adapterInfo =
    adapterList.find((a) => a.parish.toLowerCase() === parish.toLowerCase()) ??
    (SPECIAL_ADAPTERS[parish]
      ? { parish, baseUrl: SPECIAL_ADAPTERS[parish].baseUrl, bondAvailable: SPECIAL_ADAPTERS[parish].bondAvailable, sourcePlatform: "special", maxPages: 1 }
      : null);
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
