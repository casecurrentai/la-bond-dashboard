/**
 * BondCurrent Voice Screener API
 * POST /api/v1/voice-screener
 *
 * Designed for real-time use by Vapi, Retell, Bland, and custom voice agents.
 * Returns structured JSON with voice_prompt_suggestion for direct TTS playback.
 */

import { Router, Request, Response } from "express";
import { getDb } from "./db";
import {
  voiceApiCalls,
  rosterCache,
  apiUsage,
} from "../drizzle/schema";
import { scrapeParish, ScrapeResult, ScrapedBooking } from "./adapters";
import { eq, and, gt, like, or } from "drizzle-orm";
import { getJailContact } from "../shared/jailDirectory";

export const voiceScreenerRouter = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

interface VoiceScreenerRequest {
  inmate_name: string;         // "John Michael Doe" or "Doe, John"
  parish: string;              // "St. John the Baptist" or "st_john"
  caller_name?: string;
  caller_budget_available?: number;
  voice_provider?: string;     // "vapi" | "retell" | "bland"
  call_id?: string;
  session_id?: string;
  premium_rate?: number;       // default 0.10 (10%)
}

interface NormalizedInmate {
  name: string;
  bookingNumber: string;
  parish: string;
  bondAmount: number | null;
  bondText: string;
  charges: string[];
  bookingDate: string;
  age?: number;
  race?: string;
  sex?: string;
}

// ── Parish name normalization ─────────────────────────────────────────────────

const PARISH_ALIASES: Record<string, string> = {
  "st_john": "St. John the Baptist",
  "st_john_the_baptist": "St. John the Baptist",
  "stjohn": "St. John the Baptist",
  "saint john": "St. John the Baptist",
  "st john": "St. John the Baptist",
  "st. john": "St. John the Baptist",
  "st. john the baptist": "St. John the Baptist",
  "st_james": "St. James",
  "st james": "St. James",
  "st. james": "St. James",
  "plaquemines": "Plaquemines",
  "st_bernard": "St. Bernard",
  "st bernard": "St. Bernard",
  "st. bernard": "St. Bernard",
  "jefferson": "Jefferson",
  "orleans": "Orleans",
  "new orleans": "Orleans",
  "st_mary": "St. Mary",
  "st mary": "St. Mary",
  "st. mary": "St. Mary",
  "allen": "Allen",
  "evangeline": "Evangeline",
};

function normalizeParishName(raw: string): string {
  const key = raw.toLowerCase().trim().replace(/\s+/g, " ");
  return PARISH_ALIASES[key] || raw.trim();
}

// ── Name normalization ────────────────────────────────────────────────────────

function normalizeInmateName(raw: string): string {
  // Accept "John Michael Doe" → "DOE, JOHN MICHAEL"
  // Accept "Doe, John" → "DOE, JOHN"
  const trimmed = raw.trim();
  if (trimmed.includes(",")) {
    return trimmed.toUpperCase();
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(" ");
    return `${last.toUpperCase()}, ${first.toUpperCase()}`;
  }
  return trimmed.toUpperCase();
}

// ── Qualification logic ───────────────────────────────────────────────────────

type ScreenerDecision =
  | "QUALIFIED"
  | "UNQUALIFIED"
  | "PAYMENT_PLAN_ELIGIBLE"
  | "NEEDS_MANUAL_REVIEW"
  | "NOT_FOUND"
  | "ERROR";

function qualify(
  bondAmount: number | null,
  callerBudget: number | undefined,
  premiumRate: number,
  minimumThreshold: number,
  enablePaymentPlans: boolean
): {
  decision: ScreenerDecision;
  calculatedPremium: number | null;
  voicePrompt: string;
} {
  if (bondAmount === null || bondAmount === 0) {
    return {
      decision: "NEEDS_MANUAL_REVIEW",
      calculatedPremium: null,
      voicePrompt:
        "I found this inmate in the system, but the bond amount has not been set yet. This sometimes happens within the first few hours of booking. I recommend calling the jail directly or checking back in about an hour.",
    };
  }

  const premium = Math.round(bondAmount * premiumRate * 100) / 100;

  if (!callerBudget) {
    return {
      decision: "NEEDS_MANUAL_REVIEW",
      calculatedPremium: premium,
      voicePrompt: `I found the inmate. The total bond is $${bondAmount.toLocaleString()}, which means the 10% premium is $${premium.toLocaleString()}. Can you tell me how much you have available today to get started?`,
    };
  }

  if (callerBudget < minimumThreshold) {
    return {
      decision: "UNQUALIFIED",
      calculatedPremium: premium,
      voicePrompt: `I'm sorry, but the minimum amount we can work with is $${minimumThreshold.toLocaleString()}. The premium on this bond is $${premium.toLocaleString()}. Unfortunately we're unable to proceed at this time, but I can provide you with some resources for financial assistance.`,
    };
  }

  if (callerBudget >= premium) {
    return {
      decision: "QUALIFIED",
      calculatedPremium: premium,
      voicePrompt: `Great news! I found the inmate. The total bond is $${bondAmount.toLocaleString()}, which means the 10% premium is $${premium.toLocaleString()}. Since you have that available, I can transfer you to a licensed bondsman right now to get the release process started. Would you like me to do that?`,
    };
  }

  if (enablePaymentPlans && callerBudget >= premium * 0.5) {
    return {
      decision: "PAYMENT_PLAN_ELIGIBLE",
      calculatedPremium: premium,
      voicePrompt: `The total bond is $${bondAmount.toLocaleString()} and the premium is $${premium.toLocaleString()}. You don't have the full amount, but you may qualify for a payment plan with 50% down — that's $${Math.round(premium * 0.5).toLocaleString()} today. Would you like me to connect you with a bondsman to discuss that option?`,
    };
  }

  return {
    decision: "UNQUALIFIED",
    calculatedPremium: premium,
    voicePrompt: `The premium on this bond is $${premium.toLocaleString()} and unfortunately the amount you have available doesn't meet our minimum requirements. I'm sorry I couldn't help today, but please don't hesitate to call back if your situation changes.`,
  };
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

async function getCached(
  db: Awaited<ReturnType<typeof getDb>>,
  parish: string,
  nameQuery: string
): Promise<NormalizedInmate | null> {
  if (!db) return null;
  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(rosterCache)
      .where(
        and(
          eq(rosterCache.parish, parish),
          like(rosterCache.inmateName, `%${nameQuery.split(",")[0].trim()}%`),
          gt(rosterCache.expiresAt, now)
        )
      )
      .limit(1);
    if (rows.length > 0) {
      return JSON.parse(rows[0].inmateData) as NormalizedInmate;
    }
  } catch {}
  return null;
}

async function setCache(
  db: Awaited<ReturnType<typeof getDb>>,
  parish: string,
  inmate: NormalizedInmate
): Promise<void> {
  if (!db) return;
  try {
    const now = new Date();
    const expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 min TTL
    await db
      .insert(rosterCache)
      .values({
        parish,
        inmateName: inmate.name,
        inmateData: JSON.stringify(inmate),
        cachedAt: now,
        expiresAt: expires,
      })
      .onDuplicateKeyUpdate({
        set: {
          inmateData: JSON.stringify(inmate),
          cachedAt: now,
          expiresAt: expires,
        },
      });
  } catch {}
}

// ── Live scrape + name search ─────────────────────────────────────────────────

async function liveSearch(
  parish: string,
  nameQuery: string
): Promise<{ inmate: NormalizedInmate | null; source: "real-time" | "fallback" }> {
  const nameParts = nameQuery.toUpperCase().replace(",", "").split(/\s+/).filter(Boolean);
  const lastName = nameQuery.includes(",")
    ? nameQuery.split(",")[0].trim().toUpperCase()
    : nameParts[nameParts.length - 1];

  try {
    let records: any[] = [];

    // Pass the human-readable parish name directly — scrapeParish matches on a.parish.toLowerCase()
    const result: ScrapeResult = await scrapeParish(parish);
    records = result.bookings || [];

    // Find best match by last name then full name
    const match = records.find((r: any) => {
      const rName = (r.name || "").toUpperCase();
      return rName.includes(lastName);
    });

    if (!match) return { inmate: null, source: "real-time" };

    const bondAmount = match.bondAmount
      ? parseFloat(String(match.bondAmount))
      : null;

    const charges = match.chargesText
      ? match.chargesText.split(/[;,\n]/).map((c: string) => c.trim()).filter(Boolean)
      : [];

    return {
      inmate: {
        name: match.name,
        bookingNumber: match.externalBookingId || match.bookingId || "",
        parish,
        bondAmount,
        bondText: match.bondText || (bondAmount ? `$${bondAmount.toLocaleString()}` : "No Bond Set"),
        charges,
        bookingDate: match.bookingTime || match.arrestDate || "",
        age: match.age,
        race: match.race,
        sex: match.sex,
      },
      source: "real-time",
    };
  } catch (err) {
    return { inmate: null, source: "fallback" };
  }
}

// ── Main route ────────────────────────────────────────────────────────────────

voiceScreenerRouter.post("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const body = req.body as VoiceScreenerRequest;

  // Validate required fields
  if (!body.inmate_name || !body.parish) {
    return res.status(400).json({
      success: false,
      error: "MISSING_FIELDS",
      message: "Both inmate_name and parish are required.",
    });
  }

  const parish = normalizeParishName(body.parish);
  const normalizedName = normalizeInmateName(body.inmate_name);
  const premiumRate = body.premium_rate ?? 0.10;
  const minimumThreshold = 100;
  const enablePaymentPlans = true;

  const db = await getDb();

  try {
    // 1. Check cache first
    let inmate = await getCached(db, parish, normalizedName);
    let dataSource: "real-time" | "cache" | "fallback" | "mock" = "cache";

    // 2. Live scrape if not cached
    if (!inmate) {
      const result = await liveSearch(parish, normalizedName);
      inmate = result.inmate;
      dataSource = result.source;
      if (inmate) {
        await setCache(db, parish, inmate);
      }
    }

    const responseTimeMs = Date.now() - startTime;
    const scrapedAt = new Date().toISOString();

    // 3. Not found
    if (!inmate) {
      const jailContact = getJailContact(parish);
      const payload = {
        success: true,
        found: false,
        inmate_name_searched: body.inmate_name,
        parish,
        voice_prompt_suggestion: `I searched the ${parish} Parish jail roster but couldn't find anyone named ${body.inmate_name}. Could you verify the spelling of the name? Sometimes inmates are held in a neighboring parish — would you like me to check another one?`,
        data_freshness: dataSource,
        scraped_at: scrapedAt,
        response_time_ms: responseTimeMs,
        // Fallback workflow: call the booking desk
        jail_contact: jailContact ? {
          facility_name: jailContact.facilityName,
          booking_phone: jailContact.bookingPhone,
          main_phone: jailContact.mainPhone,
          address: `${jailContact.address}, ${jailContact.city}, ${jailContact.state} ${jailContact.zip}`,
          hours: jailContact.hours,
          notes: jailContact.notes,
          call_script: jailContact.callScript
            .replace(/\[INMATE NAME\]/g, body.inmate_name)
            .replace(/\[BOOKING NUMBER\]/g, "N/A — not in online roster"),
        } : null,
        workflow_action: "CALL_BOOKING_DESK",
      };

      // Log the call
      if (db) {
        await db.insert(voiceApiCalls).values({
          companyId: null,
          callerName: body.caller_name || null,
          inmateNameSearched: body.inmate_name,
          parish,
          callerBudgetAvailable: body.caller_budget_available?.toString() || null,
          found: false,
          screenerDecision: "NOT_FOUND",
          responseTimeMs,
          dataSource,
          scrapedAt: new Date(),
          voiceProvider: body.voice_provider || null,
          callId: body.call_id || null,
          sessionId: body.session_id || null,
          voicePromptSuggestion: payload.voice_prompt_suggestion,
        }).catch(() => {});
      }

      return res.json(payload);
    }

    // 4. Qualify the caller
    const { decision, calculatedPremium, voicePrompt } = qualify(
      inmate.bondAmount,
      body.caller_budget_available,
      premiumRate,
      minimumThreshold,
      enablePaymentPlans
    );
    // Inject jail contact when bond is not yet set
    const jailContact = getJailContact(parish);
    const needsCall = decision === "NEEDS_MANUAL_REVIEW";
    const payload = {
      success: true,
      found: true,
      inmate_name_searched: body.inmate_name,
      inmate_name_confirmed: inmate.name,
      booking_number: inmate.bookingNumber,
      parish,
      total_bond_amount: inmate.bondAmount,
      bond_text: inmate.bondText,
      calculated_premium: calculatedPremium,
      screener_decision: decision,
      bond_status: inmate.bondText || "Unknown",
      charges: inmate.charges,
      booking_date: inmate.bookingDate,
      age: inmate.age,
      race: inmate.race,
      sex: inmate.sex,
      voice_prompt_suggestion: voicePrompt,
      data_freshness: dataSource,
      scraped_at: scrapedAt,
      response_time_ms: responseTimeMs,
      // Fallback workflow when bond is not yet set
      jail_contact: needsCall && jailContact ? {
        facility_name: jailContact.facilityName,
        booking_phone: jailContact.bookingPhone,
        main_phone: jailContact.mainPhone,
        address: `${jailContact.address}, ${jailContact.city}, ${jailContact.state} ${jailContact.zip}`,
        hours: jailContact.hours,
        notes: jailContact.notes,
        call_script: jailContact.callScript
          .replace(/\[INMATE NAME\]/g, inmate.name)
          .replace(/\[BOOKING NUMBER\]/g, inmate.bookingNumber || "N/A"),
      } : null,
      workflow_action: needsCall ? "CALL_BOOKING_DESK" : "PROCEED",
    };

    // Log the call
    if (db) {
      await db.insert(voiceApiCalls).values({
        companyId: null,
        callerName: body.caller_name || null,
        inmateNameSearched: body.inmate_name,
        parish,
        callerBudgetAvailable: body.caller_budget_available?.toString() || null,
        found: true,
        inmateNameConfirmed: inmate.name,
        bookingNumber: inmate.bookingNumber,
        totalBondAmount: inmate.bondAmount?.toString() || null,
        calculatedPremium: calculatedPremium?.toString() || null,
        screenerDecision: decision,
        bondStatus: inmate.bondText || null,
        charges: JSON.stringify(inmate.charges),
        responseTimeMs,
        dataSource,
        scrapedAt: new Date(),
        voiceProvider: body.voice_provider || null,
        callId: body.call_id || null,
        sessionId: body.session_id || null,
        voicePromptSuggestion: voicePrompt,
      }).catch(() => {});

      // Track API usage
      await db.insert(apiUsage).values({
        companyId: null,
        endpoint: "/api/v1/voice-screener",
        success: true,
        responseTimeMs,
        billingPeriod: new Date().toISOString().slice(0, 7),
      }).catch(() => {});
    }

    return res.json(payload);
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      error: "SCRAPER_TIMEOUT",
      message: "The parish website is taking longer than usual. Please try again in a moment.",
      parish,
      response_time_ms: responseTimeMs,
    });
  }
});

// ── GET /api/v1/parishes ──────────────────────────────────────────────────────

voiceScreenerRouter.get("/parishes", (_req: Request, res: Response) => {
  res.json({
    success: true,
    parishes: [
      {
        id: "st_john_the_baptist",
        name: "St. John the Baptist",
        region: "River Parishes",
        roster_url: "https://stjohn-so-la.zuercherportal.com/",
        scraper_type: "zuercher_api",
        bond_field_present: false,
        custody_data_present: true,
        status: "active",
        priority: 1,
      },
      {
        id: "st_james",
        name: "St. James",
        region: "River Parishes",
        roster_url: null,
        scraper_type: "pending",
        bond_field_present: false,
        custody_data_present: false,
        status: "pending",
        priority: 2,
      },
      {
        id: "plaquemines",
        name: "Plaquemines",
        region: "River Parishes",
        roster_url: "http://plaquemines.lavns.org/roster.aspx",
        scraper_type: "lavine_aspnet",
        bond_field_present: false,
        custody_data_present: true,
        status: "active",
        priority: 3,
      },
      {
        id: "st_bernard",
        name: "St. Bernard",
        region: "River Parishes",
        roster_url: "http://stbernard.lavns.org/roster.aspx",
        scraper_type: "lavine_aspnet",
        bond_field_present: false,
        custody_data_present: true,
        status: "active",
        priority: 4,
      },
      {
        id: "jefferson",
        name: "Jefferson",
        region: "New Orleans Metro",
        roster_url: "https://apps.jpso.com/inmatesearch2",
        scraper_type: "custom_dotnet",
        bond_field_present: true,
        custody_data_present: true,
        status: "pending_production",
        priority: 5,
      },
      {
        id: "orleans",
        name: "Orleans",
        region: "New Orleans Metro",
        roster_url: "https://opso.gov/inmates/",
        scraper_type: "appriss_api",
        bond_field_present: false,
        custody_data_present: true,
        status: "active",
        priority: 6,
      },
      {
        id: "st_mary",
        name: "St. Mary",
        region: "South Louisiana",
        roster_url: "https://www.stmaryso.com/inmate-roster/",
        scraper_type: "most_wanted_cms",
        bond_field_present: true,
        custody_data_present: true,
        status: "active",
        priority: 7,
      },
      {
        id: "allen",
        name: "Allen",
        region: "South Louisiana",
        roster_url: "https://www.allenparishso.org/roster.php",
        scraper_type: "most_wanted_cms",
        bond_field_present: true,
        custody_data_present: true,
        status: "active",
        priority: 8,
      },
      {
        id: "evangeline",
        name: "Evangeline",
        region: "South Louisiana",
        roster_url: "https://www.evangelineparishsheriff.org/inmate-roster/",
        scraper_type: "most_wanted_cms",
        bond_field_present: true,
        custody_data_present: true,
        status: "active",
        priority: 9,
      },
    ],
    total: 9,
    bond_data_available: 3,
    custody_data_only: 5,
    pending: 1,
  });
});

// ── GET /api/v1/voice-screener/schema ─────────────────────────────────────────

voiceScreenerRouter.get("/schema", (_req: Request, res: Response) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "BondCurrent Voice Screener API",
      version: "1.0.0",
      description:
        "Real-time inmate bond lookup and caller qualification for Louisiana bail bondsmen. Designed for Vapi, Retell, Bland, and custom voice agents.",
    },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/voice-screener": {
        post: {
          summary: "Screen a caller and look up inmate bond information",
          description:
            "Searches the specified parish jail roster for the inmate, returns bond amount, calculates premium, and qualifies the caller based on available budget.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["inmate_name", "parish"],
                  properties: {
                    inmate_name: {
                      type: "string",
                      description: "Full name of the inmate. Accepts 'John Doe' or 'Doe, John'.",
                      example: "John Michael Doe",
                    },
                    parish: {
                      type: "string",
                      description: "Louisiana parish name. Accepts common aliases.",
                      example: "St. John the Baptist",
                    },
                    caller_name: { type: "string", example: "Maria Rodriguez" },
                    caller_budget_available: {
                      type: "number",
                      description: "How much the caller has available today (USD).",
                      example: 5000,
                    },
                    voice_provider: {
                      type: "string",
                      enum: ["vapi", "retell", "bland", "custom"],
                    },
                    call_id: { type: "string" },
                    session_id: { type: "string" },
                    premium_rate: {
                      type: "number",
                      default: 0.1,
                      description: "Premium rate (default 10%).",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      found: { type: "boolean" },
                      inmate_name_searched: { type: "string" },
                      inmate_name_confirmed: { type: "string" },
                      booking_number: { type: "string" },
                      parish: { type: "string" },
                      total_bond_amount: { type: "number", nullable: true },
                      calculated_premium: { type: "number", nullable: true },
                      screener_decision: {
                        type: "string",
                        enum: [
                          "QUALIFIED",
                          "UNQUALIFIED",
                          "PAYMENT_PLAN_ELIGIBLE",
                          "NEEDS_MANUAL_REVIEW",
                          "NOT_FOUND",
                          "ERROR",
                        ],
                      },
                      charges: { type: "array", items: { type: "string" } },
                      booking_date: { type: "string" },
                      voice_prompt_suggestion: {
                        type: "string",
                        description: "Pre-formatted TTS-ready sentence for the voice agent to speak.",
                      },
                      data_freshness: {
                        type: "string",
                        enum: ["real-time", "cache", "fallback", "mock"],
                      },
                      scraped_at: { type: "string", format: "date-time" },
                      response_time_ms: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});
