/**
 * St. John the Baptist Parish — Zuercher Portal Adapter
 *
 * The Zuercher Portal exposes a clean JSON API at:
 *   POST /api/portal/inmates/load
 *
 * The API requires a session cookie (ZPORTAL_SID) obtained by visiting the
 * portal homepage first. We use Playwright to get the cookie, then call the
 * API directly with axios for all subsequent requests.
 *
 * Key findings (verified Mar 2026):
 * - 211 total inmates in custody
 * - Bond data IS available in the `hold_reasons` field as structured text
 *   e.g. "Bond - Unspecified Bond, $10000.00; Set By Judge Sterling Snowdy;"
 * - Name search filter works server-side (no need to load all records)
 * - Session cookie obtained via GET /api/portal/login/user (public endpoint)
 */

import { chromium } from "playwright";
import type { ScrapedBooking } from "../adapters.js";
import { parseBondAmount } from "../adapters.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZuercherRecord {
  name: string;
  race: string;
  sex: string;
  cell_block?: string;
  arrest_date?: string;
  held_for_agency?: string;
  mugshot?: string;
  dob?: number; // age in years
  hold_reasons?: string;
  is_juvenile?: boolean;
  release_date?: string | null;
}

interface ZuercherResponse {
  total_record_count: number;
  records: ZuercherRecord[];
}

// ─── Bond parsing ─────────────────────────────────────────────────────────────

/**
 * Parse bond amount from Zuercher hold_reasons text.
 *
 * Examples:
 *   "Bond - Unspecified Bond, $10000.00; Set By Judge Sterling Snowdy;"
 *   "Bond - No Bond;"
 *   "Bond - No Bond, $0.00;"
 *   "REBOOK - from Previous Arrest; Bond - No Bond;"
 *
 * Returns null if no bond is set or bond is $0.
 */
export function parseBondFromHoldReasons(holdReasons: string | undefined | null): number | null {
  if (!holdReasons) return null;

  // Find all dollar amounts in the hold_reasons text
  const dollarMatches = holdReasons.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!dollarMatches) return null;

  // Sum all non-zero bond amounts
  let totalBond = 0;
  for (const match of dollarMatches) {
    const amount = parseBondAmount(match);
    if (amount && amount > 0) {
      totalBond += amount;
    }
  }

  return totalBond > 0 ? totalBond : null;
}

/**
 * Extract charge descriptions from hold_reasons text.
 */
function parseChargesFromHoldReasons(holdReasons: string | undefined | null): string[] {
  if (!holdReasons) return [];

  const charges: string[] = [];
  // Match "Charge: XX:XX - DESCRIPTION" patterns
  const chargeRegex = /Charge:\s*[\d:]+\s*-\s*([^;]+)/gi;
  let chargeMatch: RegExpExecArray | null;
  while ((chargeMatch = chargeRegex.exec(holdReasons)) !== null) {
    const match = chargeMatch;
    const charge = match[1].trim();
    if (charge && !charge.toLowerCase().includes("bond")) {
      charges.push(charge);
    }
  }

  // Fallback: if no structured charges, use the whole hold_reasons as charge
  if (charges.length === 0 && holdReasons.trim()) {
    // Strip bond info and return the remainder
    const cleaned = holdReasons
      .replace(/Bond\s*-[^;]+;/gi, "")
      .replace(/Set By[^;]+;/gi, "")
      .replace(/Arrest Date[^;]+;/gi, "")
      .trim();
    if (cleaned) charges.push(cleaned.slice(0, 100));
  }

  return charges;
}

// ─── Session management ───────────────────────────────────────────────────────

let cachedSessionCookie: string | null = null;
let sessionExpiresAt = 0;

async function getSessionCookie(): Promise<string> {
  const now = Date.now();
  if (cachedSessionCookie && now < sessionExpiresAt) {
    return cachedSessionCookie;
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Visit the portal to get a session cookie
    await page.goto("https://stjohn-so-la.zuercherportal.com/", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "ZPORTAL_SID");

    if (!sessionCookie) {
      throw new Error("No ZPORTAL_SID cookie found after portal visit");
    }

    cachedSessionCookie = `${sessionCookie.name}=${sessionCookie.value}`;
    // Cache for 55 minutes (sessions typically last 1 hour)
    sessionExpiresAt = now + 55 * 60 * 1000;

    return cachedSessionCookie;
  } finally {
    await browser.close();
  }
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

/**
 * Search St. John the Baptist Parish jail roster via Zuercher Portal API.
 *
 * @param searchName - Partial last name to search (e.g. "JOHNSON" or "SMITH")
 * @returns Array of matching ScrapedBooking records
 */
export async function scrapeStJohnZuercher(searchName = ""): Promise<ScrapedBooking[]> {
  const sessionCookie = await getSessionCookie();

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Navigate to the portal to establish session
    await page.goto("https://stjohn-so-la.zuercherportal.com/", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Call the API from within the page context (same-origin, session cookie auto-sent)
    const allRecords: ZuercherRecord[] = [];
    let start = 0;
    const pageSize = 50;

    while (true) {
      const response: ZuercherResponse = await page.evaluate(
        async ({ searchName, start, pageSize }) => {
          const r = await fetch("/api/portal/inmates/load", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              name: searchName.toUpperCase(),
              race: "all",
              sex: "all",
              cell_block: "all",
              held_for_agency: "any",
              in_custody: new Date().toISOString(),
              paging: { count: pageSize, start },
              sorting: { sort_by_column_tag: "name", sort_descending: false },
            }),
          });
          return r.json();
        },
        { searchName, start, pageSize }
      );

      if (!response.records || response.records.length === 0) break;

      allRecords.push(...response.records);

      // If we got fewer than pageSize, we've reached the end
      if (allRecords.length >= response.total_record_count || response.records.length < pageSize) {
        break;
      }

      start += pageSize;
    }

    // Convert to ScrapedBooking format
    return allRecords.map((record): ScrapedBooking => {
      const bondAmount = parseBondFromHoldReasons(record.hold_reasons);
      const charges = parseChargesFromHoldReasons(record.hold_reasons);

      return {
        name: record.name,
        bookingId: `STJOHN-${record.arrest_date ?? "unknown"}-${record.name.replace(/\s+/g, "-").slice(0, 20)}`,
        charges,
        bondAmount,
        bondText: bondAmount ? `$${bondAmount.toLocaleString()}` : "No Bond / Not Set",
        bookingTime: record.arrest_date ?? null,
        parish: "St. John the Baptist",
        age: typeof record.dob === "number" ? record.dob : null,
        bondAvailable: true,
        sourcePlatform: "Zuercher Portal",
      };
    });
  } finally {
    await browser.close();
  }
}

/**
 * Scrape ALL St. John inmates (for cache warming).
 */
export async function scrapeStJohnAll(): Promise<ScrapedBooking[]> {
  return scrapeStJohnZuercher("");
}
