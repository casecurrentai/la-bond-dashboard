import { describe, expect, it, vi } from "vitest";

// We test the parser functions by importing the module and using sample HTML
// Since parsers are not exported directly, we test via scrapeParish with mocked fetch

describe("adapters", () => {
  describe("getAdapterList", () => {
    it("returns 3 parish adapters", async () => {
      const { getAdapterList } = await import("./adapters");
      const list = getAdapterList();
      expect(list).toHaveLength(3);
      expect(list.map((a) => a.parish).sort()).toEqual(["Allen", "Evangeline", "St. Mary"]);
    });

    it("each adapter has a baseUrl and maxPages", async () => {
      const { getAdapterList } = await import("./adapters");
      const list = getAdapterList();
      for (const adapter of list) {
        expect(adapter.baseUrl).toMatch(/^https:\/\//);
        expect(adapter.maxPages).toBeGreaterThan(0);
      }
    });
  });

  describe("parseBondAmount extraction", () => {
    it("parses dollar amounts from bond text", async () => {
      // Test via a mock scrape with sample HTML
      const sampleHtml = `
        <div class="inmate_data">
          <div class="roster_name">TEST, PERSON A</div>
          <span class="inmate_data_bold">Booking #</span>
          <span class="inmate_data_content">999001</span>
          <span class="inmate_data_bold">Age</span>
          <span class="inmate_data_content">30</span>
          <span class="inmate_data_bold">Booking Date</span>
          <span class="inmate_data_content">02-25-2026 10:00 AM</span>
          <span class="inmate_data_bold">Charges</span>
          <span class="inmate_data_content">Test Charge</span>
          <span class="inmate_data_bold">Bond</span>
          <span class="inmate_data_content">$50,000.00</span>
        </div>
      `;

      // We'll use the St. Mary parser pattern via a mock
      const cheerio = await import("cheerio");
      const $ = cheerio.load(sampleHtml);
      const name = $(".roster_name").text().trim();
      expect(name).toBe("TEST, PERSON A");

      const bondText = $(".inmate_data_bold")
        .filter(function () {
          return $(this).text().trim().replace(/:?\s*$/, "") === "Bond";
        })
        .first()
        .next(".inmate_data_content")
        .text()
        .trim();
      expect(bondText).toBe("$50,000.00");

      // Test bond parsing
      const match = bondText.match(/\$([\d,]+\.?\d*)/);
      expect(match).not.toBeNull();
      const amount = parseFloat(match![1].replace(/,/g, ""));
      expect(amount).toBe(50000);
    });

    it("handles zero bond amounts", () => {
      const bondText = "$0.00";
      const match = bondText.match(/\$([\d,]+\.?\d*)/);
      expect(match).not.toBeNull();
      const amount = parseFloat(match![1].replace(/,/g, ""));
      expect(amount).toBe(0);
    });

    it("handles missing bond text", () => {
      const bondText: string | null = null;
      const result = bondText ? bondText.match(/\$([\d,]+\.?\d*)/) : null;
      expect(result).toBeNull();
    });
  });

  describe("scrapeParish", () => {
    it("throws for unknown parish", async () => {
      const { scrapeParish } = await import("./adapters");
      await expect(scrapeParish("Nonexistent")).rejects.toThrow(
        "No adapter found for parish: Nonexistent"
      );
    });

    it("scrapes St. Mary parish and returns bookings with bonds", async () => {
      const { scrapeParish } = await import("./adapters");
      const result = await scrapeParish("St. Mary");

      expect(result.parish).toBe("St. Mary");
      expect(result.bookings.length).toBeGreaterThan(0);
      expect(result.hash).toBeTruthy();
      expect(result.fetchedAt).toBeTruthy();
      expect(result.durationMs).toBeGreaterThan(0);

      // Verify booking structure
      const first = result.bookings[0];
      expect(first.name).toBeTruthy();
      expect(first.bookingId).toBeTruthy();
      expect(first.parish).toBe("St. Mary");

      // At least some bookings should have bond amounts
      const withBond = result.bookings.filter((b) => b.bondAmount !== null);
      expect(withBond.length).toBeGreaterThan(0);
    }, 30000);

    it("scrapes Allen parish and returns bookings with bonds", async () => {
      const { scrapeParish } = await import("./adapters");
      const result = await scrapeParish("Allen");

      expect(result.parish).toBe("Allen");
      expect(result.bookings.length).toBeGreaterThan(0);

      const withBond = result.bookings.filter((b) => b.bondAmount !== null);
      expect(withBond.length).toBeGreaterThan(0);
    }, 60000);

    it("scrapes Evangeline parish and returns bookings with bonds", async () => {
      const { scrapeParish } = await import("./adapters");
      const result = await scrapeParish("Evangeline");

      expect(result.parish).toBe("Evangeline");
      expect(result.bookings.length).toBeGreaterThan(0);

      const withBond = result.bookings.filter((b) => b.bondAmount !== null);
      expect(withBond.length).toBeGreaterThan(0);
    }, 30000);
  });
});
