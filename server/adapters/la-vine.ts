/**
 * LA VINE (Louisiana Victim Information and Notification Everyday) Adapter
 *
 * All 6 River Parishes use the same standardized ASP.NET WebForms platform.
 * One adapter class handles all of them — only the URL differs.
 *
 * Key findings (verified Mar 29, 2026):
 * - All rosters are publicly accessible, no login required
 * - 30-minute refresh cycle
 * - Table columns: Name, DOB, Race, Gender, Arrest Date
 * - Bond amounts are NOT available in LA VINE — only custody/presence data
 * - Clicking an inmate redirects to VINELink which also has no bond data
 * - Strategy: use LA VINE for presence verification, trigger no-bond workflow for bond
 *
 * Parish URLs:
 *   St. John the Baptist: http://stjohn.lavns.org/
 *   Orleans:              http://orleans.lavns.org/
 *   St. Charles:          http://stcharles.lavns.org/
 *   Ascension:            http://ascension.lavns.org/
 *   St. James:            http://www.stjames.lavns.org/roster.aspx
 *   Assumption:           http://www.assumption.lavns.org/roster.aspx
 */

import { chromium } from "playwright";
import type { ScrapedBooking } from "../adapters.js";

// ─── Parish registry ──────────────────────────────────────────────────────────

export const LA_VINE_PARISHES: Record<string, { name: string; url: string; sheriff: string }> = {
  "St. John the Baptist": {
    name: "St. John the Baptist",
    url: "http://stjohn.lavns.org/",
    sheriff: "Mike Tregre",
  },
  Orleans: {
    name: "Orleans",
    url: "http://orleans.lavns.org/",
    sheriff: "Susan Hutson",
  },
  "St. Charles": {
    name: "St. Charles",
    url: "http://stcharles.lavns.org/",
    sheriff: "Greg Champagne",
  },
  Ascension: {
    name: "Ascension",
    url: "http://ascension.lavns.org/",
    sheriff: 'Robert "Bobby" Webre',
  },
  "St. James": {
    name: "St. James",
    url: "http://www.stjames.lavns.org/roster.aspx",
    sheriff: "Claude J. Louis Jr.",
  },
  Assumption: {
    name: "Assumption",
    url: "http://www.assumption.lavns.org/roster.aspx",
    sheriff: "Leland Falcon",
  },
};

// ─── Raw row type ─────────────────────────────────────────────────────────────

interface LaVineRow {
  name: string;
  dob: string;
  race: string;
  gender: string;
  arrestDate: string;
}

// ─── Name matching ────────────────────────────────────────────────────────────

/**
 * Normalize a name string for comparison.
 * Handles both "LAST, FIRST MIDDLE" (roster format) and "FIRST LAST" (search input).
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if a roster row matches the search name.
 * Roster names are in "LAST, FIRST MIDDLE" format.
 * Search names can be in any format.
 */
function nameMatches(rosterName: string, searchName: string): boolean {
  const roster = normalizeName(rosterName);
  const search = normalizeName(searchName);

  // Direct substring match
  if (roster.includes(search) || search.includes(roster)) return true;

  // Try matching all search parts against the roster name
  const searchParts = search.split(/\s+/).filter((p) => p.length > 1);
  if (searchParts.length > 0 && searchParts.every((part) => roster.includes(part))) return true;

  // Handle "LAST, FIRST" format — convert roster to "first last" and compare
  if (roster.includes(",")) {
    const [last, rest] = roster.split(",").map((s) => s.trim());
    const firstLast = `${rest} ${last}`.trim();
    if (firstLast.includes(search) || search.includes(firstLast)) return true;
    // Also try just last name match
    if (search.includes(last) || last.includes(search)) return true;
  }

  return false;
}

// ─── Playwright scraper ───────────────────────────────────────────────────────

/**
 * Scrape a LA VINE roster page and return all inmates.
 * Uses Playwright to trigger the ASP.NET __doPostBack("lbShowAll","") and
 * parse the rendered HTML table.
 */
async function scrapeAllInmates(url: string, parishName: string): Promise<LaVineRow[]> {
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

    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });

    // Trigger "Show All" via ASP.NET postback
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__doPostBack("lbShowAll", "");
    });

    // Wait for the table to reload after postback
    await page.waitForTimeout(2500);

    // Extract all rows from the inmate table
    const rows = await page.evaluate(() => {
      const tableRows = Array.from(document.querySelectorAll("table tr"));
      const results: Array<{
        name: string;
        dob: string;
        race: string;
        gender: string;
        arrestDate: string;
      }> = [];

      for (const row of tableRows) {
        const cells = Array.from(row.querySelectorAll("td"));
        if (cells.length < 4) continue;

        const name = cells[0]?.textContent?.trim() ?? "";
        if (!name || name.toLowerCase() === "name") continue; // skip header

        // Determine column layout based on cell count
        // 5-col: Name | DOB | Race | Gender | Arrest Date
        // 4-col: Name | DOB | Gender | Arrest Date (no race)
        let dob = "";
        let race = "";
        let gender = "";
        let arrestDate = "";

        if (cells.length >= 5) {
          dob = cells[1]?.textContent?.trim() ?? "";
          race = cells[2]?.textContent?.trim() ?? "";
          gender = cells[3]?.textContent?.trim() ?? "";
          arrestDate = cells[4]?.textContent?.trim() ?? "";
        } else if (cells.length === 4) {
          dob = cells[1]?.textContent?.trim() ?? "";
          gender = cells[2]?.textContent?.trim() ?? "";
          arrestDate = cells[3]?.textContent?.trim() ?? "";
        }

        results.push({ name, dob, race, gender, arrestDate });
      }

      return results;
    });

    console.log(`[LAVineAdapter] ${parishName}: scraped ${rows.length} inmates`);
    return rows;
  } finally {
    await browser.close();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search a LA VINE parish roster for a specific inmate name.
 * Returns matching ScrapedBooking records.
 *
 * NOTE: LA VINE does not include bond amounts. All returned records will have
 * bondAmount: null and bondAvailable: false, which triggers the no-bond
 * fallback workflow in the screener.
 */
export async function scrapeLaVine(
  parishName: string,
  searchName: string
): Promise<ScrapedBooking[]> {
  const parish = LA_VINE_PARISHES[parishName];
  if (!parish) {
    throw new Error(`Unknown LA VINE parish: ${parishName}`);
  }

  const allInmates = await scrapeAllInmates(parish.url, parishName);

  const matches = allInmates.filter((row) => nameMatches(row.name, searchName));

  return matches.map((row): ScrapedBooking => {
    // Parse DOB to get approximate age
    let age: number | null = null;
    if (row.dob) {
      const dob = new Date(row.dob);
      if (!isNaN(dob.getTime())) {
        age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }
    }

    return {
      name: row.name,
      bookingId: `LAVINE-${parishName.replace(/\s+/g, "-").toUpperCase()}-${row.name.replace(/[\s,]+/g, "-").slice(0, 20)}-${row.arrestDate || "unknown"}`,
      charges: [], // LA VINE does not provide charge data
      bondAmount: null, // LA VINE does not provide bond amounts
      bondText: null,
      bookingTime: row.arrestDate || null,
      parish: parishName,
      age,
      bondAvailable: false, // Triggers no-bond fallback workflow
      sourcePlatform: "LA VINE",
    };
  });
}

/**
 * Scrape ALL inmates from a LA VINE parish (for cache warming).
 */
export async function scrapeLaVineAll(parishName: string): Promise<ScrapedBooking[]> {
  const parish = LA_VINE_PARISHES[parishName];
  if (!parish) {
    throw new Error(`Unknown LA VINE parish: ${parishName}`);
  }

  const allInmates = await scrapeAllInmates(parish.url, parishName);

  return allInmates.map((row): ScrapedBooking => {
    let age: number | null = null;
    if (row.dob) {
      const dob = new Date(row.dob);
      if (!isNaN(dob.getTime())) {
        age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }
    }

    return {
      name: row.name,
      bookingId: `LAVINE-${parishName.replace(/\s+/g, "-").toUpperCase()}-${row.name.replace(/[\s,]+/g, "-").slice(0, 20)}-${row.arrestDate || "unknown"}`,
      charges: [],
      bondAmount: null,
      bondText: null,
      bookingTime: row.arrestDate || null,
      parish: parishName,
      age,
      bondAvailable: false,
      sourcePlatform: "LA VINE",
    };
  });
}
