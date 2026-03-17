/**
 * BondCurrent Voice REST API
 * Public endpoints for voice agents and external integrations.
 */
import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { bookings } from "../drizzle/schema";
import { like, or, eq, desc } from "drizzle-orm";

export const voiceApiRouter = Router();

// CORS headers for external voice agent access
voiceApiRouter.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  next();
});

// GET /api/voice/search
voiceApiRouter.get("/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string || "").trim();
  const parish = (req.query.parish as string || "").trim();
  const type = (req.query.type as string || "name").toLowerCase();
  const limit = Math.min(parseInt(req.query.limit as string || "10"), 50);

  if (!q) {
    return res.status(400).json({ success: false, error: "MISSING_QUERY", message: "Provide ?q=search+term" });
  }

  const db = await getDb();
  if (!db) return res.status(503).json({ success: false, error: "DB_UNAVAILABLE" });

  try {
    let rows: any[] = [];
    if (type === "charge") {
      rows = await db.select().from(bookings).where(like(bookings.chargesText, `%${q}%`)).orderBy(desc(bookings.bookingTime)).limit(limit);
    } else {
      rows = await db.select().from(bookings).where(or(like(bookings.name, `%${q}%`), like(bookings.externalBookingId, `%${q}%`))).orderBy(desc(bookings.bookingTime)).limit(limit);
    }
    if (parish) rows = rows.filter(r => r.parish?.toLowerCase().includes(parish.toLowerCase()));

    const results = rows.map(r => ({
      id: r.id,
      name: r.name,
      booking_number: r.externalBookingId,
      parish: r.parish,
      bond_amount: r.bondAmount ? parseFloat(r.bondAmount) : null,
      bond_text: r.bondText || (r.bondAmount ? `$${parseFloat(r.bondAmount).toLocaleString()}` : "No Bond Set"),
      charges: r.chargesText ? r.chargesText.split(/[;,\n]/).map((c: string) => c.trim()).filter(Boolean) : [],
      booking_date: r.bookingTime,
      age: r.age,
    }));

    const voiceResponse = results.length === 0
      ? `No inmates found matching "${q}".`
      : results.length === 1
        ? `Found 1 inmate: ${results[0].name} in ${results[0].parish} Parish. Bond: ${results[0].bond_text}.`
        : `Found ${results.length} inmates matching "${q}". The first result is ${results[0].name} in ${results[0].parish} Parish with a bond of ${results[0].bond_text}.`;

    return res.json({ success: true, query: q, type, count: results.length, results, voice_response: voiceResponse });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "QUERY_FAILED", message: err.message });
  }
});

// GET /api/voice/inmate/:id
voiceApiRouter.get("/inmate/:id", async (req: Request, res: Response) => {
  const db = await getDb();
  if (!db) return res.status(503).json({ success: false, error: "DB_UNAVAILABLE" });
  try {
    const rows = await db.select().from(bookings).where(eq(bookings.id, parseInt(req.params.id))).limit(1);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "NOT_FOUND", voice_response: "I could not find that inmate record." });
    const r = rows[0];
    const bondAmount = r.bondAmount ? parseFloat(r.bondAmount) : null;
    const bondText = r.bondText || (bondAmount ? `$${bondAmount.toLocaleString()}` : "No Bond Set");
    return res.json({
      success: true,
      inmate: {
        id: r.id, name: r.name, booking_number: r.externalBookingId, parish: r.parish,
        bond_amount: bondAmount, bond_text: bondText,
        charges: r.chargesText ? r.chargesText.split(/[;,\n]/).map((c: string) => c.trim()).filter(Boolean) : [],
        booking_date: r.bookingTime, age: r.age,
      },
      voice_response: `${r.name} is currently booked in ${r.parish} Parish. Bond is set at ${bondText}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "QUERY_FAILED", message: err.message });
  }
});

// GET /api/voice/parishes
voiceApiRouter.get("/parishes", (_req: Request, res: Response) => {
  res.json({
    success: true,
    parishes: [
      { id: "st_john_the_baptist", name: "St. John the Baptist", region: "River Parishes", bond_field_present: false, status: "active", priority: 1 },
      { id: "st_james", name: "St. James", region: "River Parishes", bond_field_present: false, status: "pending", priority: 2 },
      { id: "plaquemines", name: "Plaquemines", region: "River Parishes", bond_field_present: false, status: "active", priority: 3 },
      { id: "st_bernard", name: "St. Bernard", region: "River Parishes", bond_field_present: false, status: "active", priority: 4 },
      { id: "jefferson", name: "Jefferson", region: "New Orleans Metro", bond_field_present: true, status: "pending_production", priority: 5 },
      { id: "orleans", name: "Orleans", region: "New Orleans Metro", bond_field_present: false, status: "active", priority: 6 },
      { id: "st_mary", name: "St. Mary", region: "South Louisiana", bond_field_present: true, status: "active", priority: 7 },
      { id: "allen", name: "Allen", region: "South Louisiana", bond_field_present: true, status: "active", priority: 8 },
      { id: "evangeline", name: "Evangeline", region: "South Louisiana", bond_field_present: true, status: "active", priority: 9 },
    ],
    voice_response: "BondCurrent monitors 9 Louisiana parishes. Bond amounts are available for St. Mary, Allen, Evangeline, and Jefferson parishes.",
  });
});

// GET /api/voice/stats
voiceApiRouter.get("/stats", async (_req: Request, res: Response) => {
  const db = await getDb();
  if (!db) {
    return res.json({ success: true, stats: { total_bookings: 0, total_bond_value: 0, parishes_monitored: 9, last_updated: new Date().toISOString() }, voice_response: "Database is currently initializing." });
  }
  try {
    const allBookings = await db.select().from(bookings).limit(5000);
    const totalBond = allBookings.reduce((sum, b) => sum + (b.bondAmount ? parseFloat(b.bondAmount) : 0), 0);
    const parishes = Array.from(new Set(allBookings.map(b => b.parish).filter(Boolean)));
    return res.json({
      success: true,
      stats: { total_bookings: allBookings.length, total_bond_value: totalBond, parishes_monitored: 9, parishes_with_data: parishes.length, last_updated: new Date().toISOString() },
      voice_response: `BondCurrent is tracking ${allBookings.length} active bookings across ${parishes.length} parishes with a total bond value of $${Math.round(totalBond).toLocaleString()}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "QUERY_FAILED", message: err.message });
  }
});

// GET /api/voice/schema
voiceApiRouter.get("/schema", (_req: Request, res: Response) => {
  res.json({
    openapi: "3.0.0",
    info: { title: "BondCurrent Voice API", version: "1.0.0", description: "Public REST API for voice agents to search Louisiana inmate bond data." },
    servers: [{ url: "/api/voice" }],
    paths: {
      "/search": { get: { summary: "Search inmates by name or charge", parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, { name: "type", in: "query", schema: { type: "string", enum: ["name", "charge"] } }, { name: "parish", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer", default: 10 } }] } },
      "/inmate/{id}": { get: { summary: "Get inmate detail by ID" } },
      "/parishes": { get: { summary: "List all monitored parishes" } },
      "/stats": { get: { summary: "Aggregate stats across all parishes" } },
    },
  });
});
