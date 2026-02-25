import * as cheerio from "cheerio";
import * as crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapedBooking {
  name: string;
  bookingId: string;
  bookingTime: string | null;
  parish: string;
  age: number | null;
  charges: string[];
  bondAmount: number | null;
  bondText: string | null;
}

export interface ScrapeResult {
  parish: string;
  bookings: ScrapedBooking[];
  hash: string;
  fetchedAt: string;
  durationMs: number;
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<{ html: string; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const html = await res.text();
    return { html, status: res.status };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Base parsing helpers ────────────────────────────────────────────────────

function parseBondAmount(bondText: string | null): number | null {
  if (!bondText) return null;
  const match = bondText.match(/\$([\d,]+\.?\d*)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return null;
}

// ─── St. Mary Adapter ────────────────────────────────────────────────────────

function parseStMary(html: string): ScrapedBooking[] {
  const $ = cheerio.load(html);
  const bookings: ScrapedBooking[] = [];

  $(".inmate_data").each((_i, el) => {
    const card = $(el);
    const name = card.find(".roster_name").text().trim();

    const fields: Record<string, string> = {};
    card.find(".inmate_data_bold").each((_j, boldEl) => {
      const label = $(boldEl).text().trim().replace(/:?\s*$/, "");
      const value = $(boldEl).next(".inmate_data_content").text().trim();
      fields[label] = value;
    });

    const bookingId = fields["Booking #"] || fields["Booking#"] || "";
    const age = fields["Age"] ? parseInt(fields["Age"]) : null;
    const bookingTime = fields["Booking Date"] || null;
    const charges = fields["Charges"] || "";
    const bondText = fields["Bond"] || null;

    const chargeList = charges
      ? charges.split(/\n/).map((c) => c.trim()).filter(Boolean)
      : [];

    if (bookingId) {
      bookings.push({
        name: name || "Unknown",
        bookingId,
        bookingTime,
        parish: "St. Mary",
        age,
        charges: chargeList,
        bondAmount: parseBondAmount(bondText),
        bondText,
      });
    }
  });

  return bookings;
}

// ─── Allen Adapter ───────────────────────────────────────────────────────────

function parseAllen(html: string): ScrapedBooking[] {
  const $ = cheerio.load(html);
  const bookings: ScrapedBooking[] = [];

  $(".inmate_div").each((_i, el) => {
    const card = $(el);
    const dataDiv = card.find(".inmate_data");
    if (!dataDiv.length) return;

    const name = dataDiv.find("strong.ptitles").first().text().trim();

    const fields: Record<string, string> = {};
    dataDiv.find(".inmate_data_bold").each((_j, boldEl) => {
      const label = $(boldEl).text().trim().replace(/:?\s*$/, "");
      const contentDiv = $(boldEl).closest(".row").find(".inmate_data_content");
      const value = contentDiv.text().trim();
      fields[label] = value;
    });

    const bookingId = fields["Booking #"] || fields["Booking#"] || "";
    const bookingTime = fields["Booking Date"] || null;
    const charges = fields["Charges"] || "";
    const bondText = fields["Bond"] || null;

    const chargeList = charges
      ? charges.split(/\n/).map((c) => c.trim()).filter(Boolean)
      : [];

    if (bookingId) {
      bookings.push({
        name: name || "Unknown",
        bookingId,
        bookingTime,
        parish: "Allen",
        age: null,
        charges: chargeList,
        bondAmount: parseBondAmount(bondText),
        bondText,
      });
    }
  });

  return bookings;
}

// ─── Evangeline Adapter ──────────────────────────────────────────────────────

function parseEvangeline(html: string): ScrapedBooking[] {
  const $ = cheerio.load(html);
  const bookings: ScrapedBooking[] = [];

  $(".inmate_data").each((_i, el) => {
    const card = $(el);
    const name = card.find(".roster_name").text().trim();

    const fields: Record<string, string> = {};
    card.find(".inmate_data_bold").each((_j, boldEl) => {
      const label = $(boldEl).text().trim().replace(/:?\s*$/, "");
      const value = $(boldEl).next(".inmate_data_content").text().trim();
      fields[label] = value;
    });

    const bookingId = fields["Booking #"] || fields["Booking#"] || "";
    const age = fields["Age"] ? parseInt(fields["Age"]) : null;
    const bookingTime = fields["Booking Date"] || null;
    const chargesRaw = fields["Charges"] || "";
    const bondText = fields["Bond"] || null;

    const chargeList = chargesRaw
      ? chargesRaw.split(/\n/).map((c) => c.trim()).filter(Boolean)
      : [];

    if (bookingId) {
      bookings.push({
        name: name || "Unknown",
        bookingId,
        bookingTime,
        parish: "Evangeline",
        age,
        charges: chargeList,
        bondAmount: parseBondAmount(bondText),
        bondText,
      });
    }
  });

  return bookings;
}

// ─── Adapter registry ────────────────────────────────────────────────────────

interface AdapterConfig {
  parish: string;
  baseUrl: string;
  getPageUrl: (page: number) => string;
  parser: (html: string) => ScrapedBooking[];
  hasNextPage: ($: cheerio.CheerioAPI) => boolean;
  maxPages: number;
}

const ADAPTERS: AdapterConfig[] = [
  {
    parish: "St. Mary",
    baseUrl: "https://www.stmaryso.com/inmate-roster/filters/current/booking_time=desc/1",
    getPageUrl: (page) =>
      `https://www.stmaryso.com/inmate-roster/filters/current/booking_time=desc/${page}`,
    parser: parseStMary,
    hasNextPage: ($) =>
      $("a").filter(function () {
        const text = $(this).text().trim();
        return text === "\u00BB Next" || text === "> Next" || text === ">";
      }).length > 0,
    maxPages: 10,
  },
  {
    parish: "Allen",
    baseUrl: "https://www.allenparishso.org/roster.php",
    getPageUrl: (page) => {
      if (page === 1) return "https://www.allenparishso.org/roster.php";
      const grp = (page - 1) * 10;
      return `https://www.allenparishso.org/roster.php?&grp=${grp}`;
    },
    parser: parseAllen,
    hasNextPage: ($) =>
      $("a").filter(function () {
        const text = $(this).text().trim();
        return text === "\u00BB Next" || text === "> Next" || text === ">" || text === "\u00BB";
      }).length > 0,
    maxPages: 20,
  },
  {
    parish: "Evangeline",
    baseUrl:
      "https://www.evangelineparishsheriff.org/inmate-roster/filters/current/booking_time=desc/1",
    getPageUrl: (page) =>
      `https://www.evangelineparishsheriff.org/inmate-roster/filters/current/booking_time=desc/${page}`,
    parser: parseEvangeline,
    hasNextPage: ($) =>
      $("a").filter(function () {
        const text = $(this).text().trim();
        return text === "\u00BB Next" || text === "> Next" || text === ">";
      }).length > 0,
    maxPages: 10,
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAdapterList() {
  return ADAPTERS.map((a) => ({
    parish: a.parish,
    baseUrl: a.baseUrl,
    maxPages: a.maxPages,
  }));
}

export async function scrapeParish(parish: string): Promise<ScrapeResult> {
  const adapter = ADAPTERS.find(
    (a) => a.parish.toLowerCase() === parish.toLowerCase()
  );
  if (!adapter) {
    throw new Error(`No adapter found for parish: ${parish}`);
  }

  const startTime = Date.now();
  const allBookings: ScrapedBooking[] = [];
  let fullHtml = "";

  for (let page = 1; page <= adapter.maxPages; page++) {
    const url = adapter.getPageUrl(page);
    try {
      const { html, status } = await fetchPage(url);
      if (status !== 200) break;
      fullHtml += html;
      const bookings = adapter.parser(html);
      allBookings.push(...bookings);

      const $ = cheerio.load(html);
      if (!adapter.hasNextPage($)) break;
    } catch (err) {
      console.error(`Error fetching page ${page} for ${adapter.parish}:`, err);
      break;
    }
  }

  const hash = crypto.createHash("sha256").update(fullHtml).digest("hex").slice(0, 16);

  return {
    parish: adapter.parish,
    bookings: allBookings,
    hash,
    fetchedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  };
}

export async function scrapeAllParishes(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  for (const adapter of ADAPTERS) {
    try {
      const result = await scrapeParish(adapter.parish);
      results.push(result);
    } catch (err) {
      console.error(`Failed to scrape ${adapter.parish}:`, err);
      results.push({
        parish: adapter.parish,
        bookings: [],
        hash: "",
        fetchedAt: new Date().toISOString(),
        durationMs: 0,
      });
    }
  }
  return results;
}
