/**
 * BondCurrent — Voice Agent REST API
 *
 * Designed for voice agent consumption (Vapi, Retell, ElevenLabs, custom LLM agents).
 * All responses are structured JSON optimized for:
 *   - Natural language generation (NLG) by voice agents
 *   - Minimal latency (flat structures, no deep nesting)
 *   - Human-readable field names for TTS rendering
 *
 * Endpoints:
 *   GET /api/voice/search?q=<name_or_charge>&parish=<optional>&limit=<optional>
 *   GET /api/voice/inmate/:id
 *   GET /api/voice/parishes
 *   GET /api/voice/stats
 *   GET /api/voice/schema        — OpenAPI-style schema for agent tool use
 *
 * Rate limit: 60 requests/minute per IP (enforced in production via gateway)
 */

import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { bookings, sources, scrapeLogs } from "../drizzle/schema";
import { like, or, desc, eq, and, sql } from "drizzle-orm";

const router = Router();

// ─── CORS for voice agent external access ────────────────────────────────────
router.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Agent-ID");
  res.setHeader("Cache-Control", "no-cache, no-store");
  next();
});

router.options("*", (_req: Request, res: Response) => {
  res.sendStatus(200);
});

// ─── Helper: format bond amount for voice ────────────────────────────────────
function formatBondForVoice(amount: string | null): string {
  if (!amount) return "bond amount not publicly available";
  const num = parseFloat(amount);
  if (isNaN(num)) return "bond amount not publicly available";
  if (num === 0) return "no bond required";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Helper: build voice summary sentence ────────────────────────────────────
function buildVoiceSummary(
  name: string,
  parish: string,
  bookingTime: string | null,
  charges: string[],
  bondAmount: string | null,
  bondAvailable: boolean
): string {
  const dateStr = bookingTime ? ` on ${bookingTime}` : "";
  const chargeStr = charges.length > 0
    ? ` on charges of ${charges.slice(0, 3).join(", ")}`
    : "";
  const bondStr = bondAvailable
    ? ` Bond is set at ${formatBondForVoice(bondAmount)}.`
    : " Bond information is not publicly available for this parish.";
  return `${name} is booked in ${parish} Parish${dateStr}${chargeStr}.${bondStr}`;
}

// ─── Helper: format booking row for voice response ───────────────────────────
function formatBookingForVoice(row: {
  id: number;
  externalBookingId: string;
  name: string;
  parish: string;
  bookingTime: string | null;
  chargesText: string | null;
  bondAmount: string | null;
  bondText: string | null;
}) {
  const chargeList = row.chargesText
    ? row.chargesText.split("|").map((c) => c.trim()).filter(Boolean).slice(0, 5)
    : [];

  // Determine if this parish has bond available
  const bondAvailableParishes = ["St. Mary", "Allen", "Evangeline", "Jefferson"];
  const bondAvailable = bondAvailableParishes.includes(row.parish);

  return {
    id: row.id,
    booking_id: row.externalBookingId,
    full_name: row.name,
    parish: row.parish,
    booking_date: row.bookingTime || "unknown",
    charges: chargeList,
    charges_summary: chargeList.length > 0 ? chargeList.join(", ") : "no charges listed",
    bond_amount: row.bondAmount ? parseFloat(row.bondAmount) : null,
    bond_display: formatBondForVoice(row.bondAmount),
    bond_available: bondAvailable,
    voice_summary: buildVoiceSummary(
      row.name,
      row.parish,
      row.bookingTime,
      chargeList,
      row.bondAmount,
      bondAvailable
    ),
  };
}

// ─── GET /api/voice/schema ────────────────────────────────────────────────────
router.get("/schema", (_req: Request, res: Response) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "BondCurrent Voice API",
      version: "1.0.0",
      description: "Search Louisiana parish inmate rosters and bond information. Optimized for voice agent consumption (Vapi, Retell, ElevenLabs, custom LLM agents).",
      contact: { name: "BondCurrent", url: "https://bondcurrent.com" },
    },
    servers: [{ url: "/api/voice", description: "BondCurrent Voice API" }],
    paths: {
      "/search": {
        get: {
          operationId: "searchInmates",
          summary: "Search inmates by name or charge across Louisiana parishes",
          description: "Returns matching inmates with booking details, charges, and bond amounts where available. Use when a caller asks about a specific person or charge. The voice_response field contains a pre-formatted sentence ready for TTS output.",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              description: "Name (last name, first name, or full name) or charge/offense to search for. Case-insensitive.",
              schema: { type: "string", example: "SMITH" },
            },
            {
              name: "parish",
              in: "query",
              required: false,
              description: "Filter by specific parish name",
              schema: {
                type: "string",
                enum: ["St. Mary", "Allen", "Evangeline", "Plaquemines", "St. Bernard", "Orleans", "Jefferson", "St. John the Baptist"],
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Maximum number of results (default 10, max 50)",
              schema: { type: "integer", default: 10, maximum: 50 },
            },
          ],
          responses: {
            "200": {
              description: "Search results with voice-ready response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SearchResponse" },
                },
              },
            },
          },
        },
      },
      "/inmate/{id}": {
        get: {
          operationId: "getInmate",
          summary: "Get full details for a specific inmate by database ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Inmate database ID (from search results)",
              schema: { type: "integer" },
            },
          ],
          responses: {
            "200": { description: "Inmate record", content: { "application/json": { schema: { $ref: "#/components/schemas/InmateRecord" } } } },
            "404": { description: "Inmate not found" },
          },
        },
      },
      "/parishes": {
        get: {
          operationId: "listParishes",
          summary: "List all monitored parishes with data source status and bond availability",
          responses: {
            "200": { description: "Parish list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ParishStatus" } } } } },
          },
        },
      },
      "/stats": {
        get: {
          operationId: "getStats",
          summary: "Get aggregate statistics across all monitored parishes",
          responses: {
            "200": { description: "Statistics with voice-ready summary", content: { "application/json": { schema: { $ref: "#/components/schemas/Stats" } } } },
          },
        },
      },
    },
    components: {
      schemas: {
        InmateRecord: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Database ID" },
            booking_id: { type: "string", description: "External booking ID from source system" },
            full_name: { type: "string" },
            parish: { type: "string" },
            booking_date: { type: "string" },
            charges: { type: "array", items: { type: "string" } },
            charges_summary: { type: "string", description: "Comma-separated charges for TTS" },
            bond_amount: { type: "number", nullable: true },
            bond_display: { type: "string", description: "Human-readable bond amount (e.g. '$10,000')" },
            bond_available: { type: "boolean", description: "Whether this parish publishes bond data" },
            voice_summary: { type: "string", description: "Complete TTS-ready sentence about this inmate" },
          },
        },
        SearchResponse: {
          type: "object",
          properties: {
            query: { type: "string" },
            parish_filter: { type: "string", nullable: true },
            total_results: { type: "integer" },
            results: { type: "array", items: { $ref: "#/components/schemas/InmateRecord" } },
            voice_response: { type: "string", description: "Pre-formatted TTS-ready response for the entire search" },
          },
        },
        ParishStatus: {
          type: "object",
          properties: {
            parish: { type: "string" },
            platform: { type: "string" },
            bond_available: { type: "boolean" },
            last_scraped: { type: "string", nullable: true },
            inmate_count: { type: "integer" },
            source_url: { type: "string" },
            status: { type: "string", enum: ["active", "pending", "error"] },
          },
        },
        Stats: {
          type: "object",
          properties: {
            total_inmates: { type: "integer" },
            total_with_bond: { type: "integer" },
            total_bond_value: { type: "number" },
            parishes_monitored: { type: "integer" },
            last_updated: { type: "string" },
            voice_summary: { type: "string", description: "TTS-ready summary of current system status" },
          },
        },
      },
    },
  });
});

// ─── GET /api/voice/parishes ──────────────────────────────────────────────────
router.get("/parishes", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();

    const parishConfig = [
      { parish: "St. Mary", platform: "Most Wanted CMS", bondAvailable: true, url: "https://www.stmaryso.com/inmate-roster" },
      { parish: "Allen", platform: "Most Wanted CMS", bondAvailable: true, url: "https://www.allenparishso.org/roster.php" },
      { parish: "Evangeline", platform: "Most Wanted CMS", bondAvailable: true, url: "https://www.evangelineparishsheriff.org/inmate-roster" },
      { parish: "St. John the Baptist", platform: "Zuercher Portal", bondAvailable: false, url: "https://stjohn-so-la.zuercherportal.com/#/inmates" },
      { parish: "Plaquemines", platform: "LA VINE ASP.NET", bondAvailable: false, url: "http://plaquemines.lavns.org/roster.aspx" },
      { parish: "St. Bernard", platform: "LA VINE ASP.NET", bondAvailable: false, url: "http://stbernard.lavns.org/roster.aspx" },
      { parish: "Orleans", platform: "Appriss/OCV API", bondAvailable: false, url: "https://opso.gov/inmate-search" },
      { parish: "Jefferson", platform: "JPSO Custom SPA", bondAvailable: true, url: "https://apps.jpso.com/inmatesearch2" },
    ];

    let sourceRows: { parish: string; lastPolledAt: Date | null; recordCount: number; lastError: string | null }[] = [];
    if (db) {
      sourceRows = await db.select({
        parish: sources.parish,
        lastPolledAt: sources.lastPolledAt,
        recordCount: sources.recordCount,
        lastError: sources.lastError,
      }).from(sources);
    }

    const result = parishConfig.map((p) => {
      const src = sourceRows.find((s) => s.parish === p.parish);
      return {
        parish: p.parish,
        platform: p.platform,
        bond_available: p.bondAvailable,
        last_scraped: src?.lastPolledAt?.toISOString() ?? null,
        inmate_count: src?.recordCount ?? 0,
        source_url: p.url,
        status: src ? (src.lastError ? "error" : "active") : "pending",
      };
    });

    res.json(result);
  } catch (err) {
    console.error("[Voice API] Parishes error:", err);
    res.status(500).json({ error: "Failed to fetch parish list" });
  }
});

// ─── GET /api/voice/stats ─────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();

    if (!db) {
      return res.json({
        total_inmates: 0,
        total_with_bond: 0,
        total_bond_value: 0,
        parishes_monitored: 8,
        last_updated: new Date().toISOString(),
        voice_summary: "BondCurrent is monitoring 8 Louisiana parishes. No data has been loaded yet. Please trigger a data refresh.",
      });
    }

    const countResult = await db.select({
      total: sql<number>`count(*)`,
      withBond: sql<number>`sum(case when bond_amount is not null and bond_amount > 0 then 1 else 0 end)`,
      totalBond: sql<number>`sum(case when bond_amount is not null then cast(bond_amount as decimal) else 0 end)`,
    }).from(bookings);

    const stats = countResult[0];
    const totalInmates = Number(stats?.total ?? 0);
    const totalWithBond = Number(stats?.withBond ?? 0);
    const totalBondValue = Number(stats?.totalBond ?? 0);

    const lastLog = await db.select({ scrapedAt: scrapeLogs.scrapedAt })
      .from(scrapeLogs)
      .orderBy(desc(scrapeLogs.scrapedAt))
      .limit(1);

    const lastUpdated = lastLog[0]?.scrapedAt?.toISOString() ?? new Date().toISOString();

    const voiceSummary = totalInmates > 0
      ? `BondCurrent is monitoring 8 Louisiana parishes with ${totalInmates.toLocaleString()} active bookings. ${totalWithBond.toLocaleString()} inmates have bond set, totaling ${formatBondForVoice(totalBondValue.toString())}.`
      : "BondCurrent is monitoring 8 Louisiana parishes. Trigger a data refresh to load current inmate records.";

    res.json({
      total_inmates: totalInmates,
      total_with_bond: totalWithBond,
      total_bond_value: totalBondValue,
      parishes_monitored: 8,
      last_updated: lastUpdated,
      voice_summary: voiceSummary,
    });
  } catch (err) {
    console.error("[Voice API] Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── GET /api/voice/search ────────────────────────────────────────────────────
router.get("/search", async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").trim();
  const parish = ((req.query.parish as string) || "").trim();
  const limit = Math.min(parseInt((req.query.limit as string) || "10"), 50);

  if (!q || q.length < 2) {
    return res.status(400).json({
      error: "Query parameter 'q' is required and must be at least 2 characters",
      voice_response: "Please provide a name or charge to search for.",
    });
  }

  try {
    const db = await getDb();

    if (!db) {
      return res.json({
        query: q,
        parish_filter: parish || null,
        total_results: 0,
        results: [],
        voice_response: `No results found for ${q}. The database is not yet populated. Please trigger a data refresh.`,
      });
    }

    const searchTerm = `%${q.toUpperCase()}%`;
    const nameCondition = like(bookings.name, searchTerm);
    const chargeCondition = like(bookings.chargesText, searchTerm);
    const searchCondition = or(nameCondition, chargeCondition)!;

    const whereClause = parish
      ? and(searchCondition, eq(bookings.parish, parish))
      : searchCondition;

    const rows = await db
      .select({
        id: bookings.id,
        externalBookingId: bookings.externalBookingId,
        name: bookings.name,
        parish: bookings.parish,
        bookingTime: bookings.bookingTime,
        chargesText: bookings.chargesText,
        bondAmount: bookings.bondAmount,
        bondText: bookings.bondText,
      })
      .from(bookings)
      .where(whereClause)
      .orderBy(desc(bookings.firstSeenAt))
      .limit(limit);

    const results = rows.map((row) =>
      formatBookingForVoice({
        id: row.id,
        externalBookingId: row.externalBookingId,
        name: row.name,
        parish: row.parish,
        bookingTime: row.bookingTime ?? null,
        chargesText: row.chargesText ?? null,
        bondAmount: row.bondAmount ?? null,
        bondText: row.bondText ?? null,
      })
    );

    // Build voice response
    let voiceResponse: string;
    if (results.length === 0) {
      voiceResponse = `No inmates found matching "${q}"${parish ? ` in ${parish} Parish` : " across monitored parishes"}.`;
    } else if (results.length === 1) {
      voiceResponse = results[0].voice_summary;
    } else {
      const names = results
        .slice(0, 3)
        .map((r) => r.full_name)
        .join(", ");
      const bondCount = results.filter((r) => r.bond_amount !== null).length;
      voiceResponse = `Found ${results.length} inmates matching "${q}". Top results include: ${names}. ${bondCount} of ${results.length} have bond information available.`;
    }

    res.json({
      query: q,
      parish_filter: parish || null,
      total_results: results.length,
      results,
      voice_response: voiceResponse,
    });
  } catch (err) {
    console.error("[Voice API] Search error:", err);
    res.status(500).json({
      error: "Search failed",
      voice_response: "I encountered an error while searching. Please try again.",
    });
  }
});

// ─── GET /api/voice/inmate/:id ────────────────────────────────────────────────
router.get("/inmate/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      error: "Invalid ID — must be a numeric database ID",
      voice_response: "That is not a valid inmate ID.",
    });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(404).json({ error: "Database not available" });
    }

    const rows = await db
      .select({
        id: bookings.id,
        externalBookingId: bookings.externalBookingId,
        name: bookings.name,
        parish: bookings.parish,
        bookingTime: bookings.bookingTime,
        chargesText: bookings.chargesText,
        bondAmount: bookings.bondAmount,
        bondText: bookings.bondText,
      })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Inmate not found",
        voice_response: `No inmate found with ID ${id}.`,
      });
    }

    const row = rows[0];
    const result = formatBookingForVoice({
      id: row.id,
      externalBookingId: row.externalBookingId,
      name: row.name,
      parish: row.parish,
      bookingTime: row.bookingTime ?? null,
      chargesText: row.chargesText ?? null,
      bondAmount: row.bondAmount ?? null,
      bondText: row.bondText ?? null,
    });

    res.json(result);
  } catch (err) {
    console.error("[Voice API] Get inmate error:", err);
    res.status(500).json({
      error: "Failed to retrieve inmate",
      voice_response: "I encountered an error while retrieving that record.",
    });
  }
});

export default router;
