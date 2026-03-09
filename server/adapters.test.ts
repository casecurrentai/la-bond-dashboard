/**
 * BondCurrent — Adapter Unit Tests
 * Tests parsers with real HTML fixtures and API response fixtures.
 * Network tests are marked with 30s+ timeouts.
 */

import { describe, it, expect, vi } from "vitest";
import { parseBondAmount, getAdapterList, scrapeParish } from "./adapters";

// ─── parseBondAmount unit tests ───────────────────────────────────────────────

describe("parseBondAmount", () => {
  it("parses standard dollar format", () => {
    expect(parseBondAmount("$10,000.00")).toBe(10000);
  });

  it("parses dollar format without cents", () => {
    expect(parseBondAmount("$500")).toBe(500);
  });

  it("parses large bond amounts", () => {
    expect(parseBondAmount("$1,250,000.00")).toBe(1250000);
  });

  it("returns null for null input", () => {
    expect(parseBondAmount(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseBondAmount("")).toBeNull();
  });

  it("returns null for 'No Bond' text", () => {
    expect(parseBondAmount("No Bond")).toBeNull();
  });

  it("returns 0 for $0.00", () => {
    expect(parseBondAmount("$0.00")).toBe(0);
  });

  it("parses bond with surrounding text", () => {
    expect(parseBondAmount("Bond Amount: $75,000.00")).toBe(75000);
  });
});

// ─── Adapter registry tests ───────────────────────────────────────────────────

describe("getAdapterList", () => {
  it("returns at least 5 adapters", () => {
    const list = getAdapterList();
    expect(list.length).toBeGreaterThanOrEqual(5);
  });

  it("each adapter has required fields", () => {
    const list = getAdapterList();
    for (const adapter of list) {
      expect(adapter).toHaveProperty("parish");
      expect(adapter).toHaveProperty("baseUrl");
      expect(adapter).toHaveProperty("bondAvailable");
      expect(adapter).toHaveProperty("sourcePlatform");
      expect(typeof adapter.parish).toBe("string");
      expect(typeof adapter.bondAvailable).toBe("boolean");
    }
  });

  it("includes bond-available parishes", () => {
    const list = getAdapterList();
    const bondParishes = list.filter((a) => a.bondAvailable);
    expect(bondParishes.length).toBeGreaterThanOrEqual(2);
    const names = bondParishes.map((a) => a.parish);
    expect(names).toContain("St. Mary");
    expect(names).toContain("Evangeline");
  });

  it("includes no-bond parishes with correct flag", () => {
    const list = getAdapterList();
    const noBondParishes = list.filter((a) => !a.bondAvailable);
    expect(noBondParishes.length).toBeGreaterThanOrEqual(2);
    const names = noBondParishes.map((a) => a.parish);
    expect(names).toContain("Plaquemines");
    expect(names).toContain("St. Bernard");
  });

  it("St. Mary uses most_wanted_cms platform", () => {
    const list = getAdapterList();
    const stMary = list.find((a) => a.parish === "St. Mary");
    expect(stMary?.sourcePlatform).toBe("most_wanted_cms");
  });

  it("Plaquemines uses lavine_aspnet platform", () => {
    const list = getAdapterList();
    const plaquemines = list.find((a) => a.parish === "Plaquemines");
    expect(plaquemines?.sourcePlatform).toBe("lavine_aspnet");
  });

  it("St. Bernard uses lavine_aspnet platform", () => {
    const list = getAdapterList();
    const stBernard = list.find((a) => a.parish === "St. Bernard");
    expect(stBernard?.sourcePlatform).toBe("lavine_aspnet");
  });
});

// ─── Bond field availability matrix ──────────────────────────────────────────

describe("Bond field availability matrix", () => {
  const EXPECTED_MATRIX = [
    { parish: "St. Mary", bondAvailable: true, platform: "most_wanted_cms" },
    { parish: "Allen", bondAvailable: true, platform: "most_wanted_cms" },
    { parish: "Evangeline", bondAvailable: true, platform: "most_wanted_cms" },
    { parish: "Plaquemines", bondAvailable: false, platform: "lavine_aspnet" },
    { parish: "St. Bernard", bondAvailable: false, platform: "lavine_aspnet" },
  ];

  it("adapter list matches expected availability matrix", () => {
    const list = getAdapterList();
    for (const expected of EXPECTED_MATRIX) {
      const actual = list.find((a) => a.parish === expected.parish);
      expect(actual, `Adapter for ${expected.parish} should exist`).toBeDefined();
      expect(actual?.bondAvailable).toBe(expected.bondAvailable);
      expect(actual?.sourcePlatform).toBe(expected.platform);
    }
  });

  it("bond-available adapters all use most_wanted_cms", () => {
    const list = getAdapterList();
    const bondAdapters = list.filter((a) => a.bondAvailable);
    for (const adapter of bondAdapters) {
      expect(adapter.sourcePlatform).toBe("most_wanted_cms");
    }
  });

  it("no-bond adapters all use lavine_aspnet", () => {
    const list = getAdapterList();
    const noBondAdapters = list.filter((a) => !a.bondAvailable);
    for (const adapter of noBondAdapters) {
      expect(adapter.sourcePlatform).toBe("lavine_aspnet");
    }
  });
});

// ─── HTML parser fixture tests ────────────────────────────────────────────────

describe("Most Wanted CMS HTML parser", () => {
  it("parses bond amount from fixture HTML", async () => {
    const cheerio = await import("cheerio");
    const sampleHtml = `
      <div class="inmate_data">
        <div class="roster_name">SMITH, JOHN A</div>
        <span class="inmate_data_bold">Booking #</span>
        <span class="inmate_data_content">260001</span>
        <span class="inmate_data_bold">Age</span>
        <span class="inmate_data_content">35</span>
        <span class="inmate_data_bold">Booking Date</span>
        <span class="inmate_data_content">01/15/2026</span>
        <span class="inmate_data_bold">Charges</span>
        <span class="inmate_data_content">DWI FIRST OFFENSE</span>
        <span class="inmate_data_bold">Bond</span>
        <span class="inmate_data_content">$2,500.00</span>
      </div>
    `;
    const $ = cheerio.load(sampleHtml);
    const name = $(".roster_name").text().trim();
    expect(name).toBe("SMITH, JOHN A");

    const bondText = $(".inmate_data_bold")
      .filter(function () {
        return $(this).text().trim().replace(/:?\s*$/, "") === "Bond";
      })
      .first()
      .next(".inmate_data_content")
      .text()
      .trim();
    expect(bondText).toBe("$2,500.00");
    expect(parseBondAmount(bondText)).toBe(2500);
  });

  it("handles No Bond text correctly", async () => {
    const cheerio = await import("cheerio");
    const sampleHtml = `
      <div class="inmate_data">
        <div class="roster_name">DOE, JANE B</div>
        <span class="inmate_data_bold">Booking #</span>
        <span class="inmate_data_content">260002</span>
        <span class="inmate_data_bold">Bond</span>
        <span class="inmate_data_content">No Bond</span>
      </div>
    `;
    const $ = cheerio.load(sampleHtml);
    const bondText = $(".inmate_data_bold")
      .filter(function () {
        return $(this).text().trim().replace(/:?\s*$/, "") === "Bond";
      })
      .first()
      .next(".inmate_data_content")
      .text()
      .trim();
    expect(bondText).toBe("No Bond");
    expect(parseBondAmount(bondText)).toBeNull();
  });
});

// ─── scrapeParish error handling ──────────────────────────────────────────────

describe("scrapeParish", () => {
  it("throws for unknown parish", async () => {
    await expect(scrapeParish("Nonexistent")).rejects.toThrow(
      "No adapter found for parish: Nonexistent"
    );
  });

  it("scrapes Evangeline parish and returns bookings with bonds", async () => {
    const result = await scrapeParish("Evangeline");
    expect(result.parish).toBe("Evangeline");
    expect(result.bookings.length).toBeGreaterThan(0);
    expect(result.bondAvailable).toBe(true);
    const withBond = result.bookings.filter((b) => b.bondAmount !== null);
    expect(withBond.length).toBeGreaterThan(0);
    // Verify bond amounts are positive numbers
    withBond.forEach((b) => {
      expect(b.bondAmount).toBeGreaterThanOrEqual(0);
    });
  }, 30000);

  it("scrapes Plaquemines and returns bondAvailable=false", async () => {
    const result = await scrapeParish("Plaquemines");
    expect(result.parish).toBe("Plaquemines");
    expect(result.bondAvailable).toBe(false);
    // All bookings should have null bond amounts
    result.bookings.forEach((b) => {
      expect(b.bondAmount).toBeNull();
      expect(b.bondAvailable).toBe(false);
    });
  }, 30000);

  it("scrapes St. Bernard and returns bondAvailable=false", async () => {
    const result = await scrapeParish("St. Bernard");
    expect(result.parish).toBe("St. Bernard");
    expect(result.bondAvailable).toBe(false);
  }, 30000);
});
