/**
 * MarketingHome.tsx — BondCurrent Marketing Landing Page
 * Design inspired by chatgpt.com/overview:
 *  - Massive centered hero with eyebrow + headline + CTA pair
 *  - Scrolling ticker of real search examples
 *  - Full-bleed feature sections with app mockups in gradient containers
 *  - Features grid (2-col alternating)
 *  - Pricing cards
 *  - Final CTA banner
 *  - Clean sticky nav
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Search, Bell, Shield, Zap, Download,
  ChevronRight, Check, ArrowRight, Menu, X,
  Mic, MapPin,
} from "lucide-react";

/* ── Ticker items ─────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Search 'JOHNSON, MARCUS' across all parishes",
  "Alert me when bond amount changes for inmate #4821",
  "Show all DWI arrests in Jefferson Parish this week",
  "Find bookings with bond over $50,000",
  "Export St. Mary Parish bookings to CSV",
  "Monitor Evangeline Parish for THEFT charges",
  "Search 'WILLIAMS' — St. Bernard Parish",
  "Set alert: release notification for case #2024-1847",
  "Show bond trends for Allen Parish — last 30 days",
  "Find all bookings with no bond set today",
  "Search by charge: POSSESSION OF CONTROLLED SUBSTANCE",
  "Download Jefferson Parish weekly booking report",
];

/* ── Features ─────────────────────────────────────────────── */
const FEATURES = [
  {
    eyebrow: "Real-Time Search",
    headline: "Find any inmate across all Louisiana parishes instantly.",
    body: "Search by name, charge, booking ID, or bond amount across St. Mary, Allen, Evangeline, Jefferson, and more — all in one unified interface updated every 30 minutes.",
    gradient: "linear-gradient(135deg, #0a1628 0%, #0f2a4a 50%, #0a1e3d 100%)",
    accentColor: "#22d3ee",
    mockup: "search",
  },
  {
    eyebrow: "Smart Alerts",
    headline: "Never miss a bond change or release.",
    body: "Subscribe to any inmate and receive instant email notifications when their bond amount changes, charges are updated, or they are released. Magic-link confirmation — no account required.",
    gradient: "linear-gradient(135deg, #0a1a1a 0%, #0a2a1e 50%, #0a1a14 100%)",
    accentColor: "#10b981",
    mockup: "alert",
  },
  {
    eyebrow: "Voice Search",
    headline: "Search hands-free with your voice.",
    body: "Tap the microphone and speak a name or charge. Our AI layer normalizes your query — handling nicknames, partial names, and charge abbreviations — and returns results instantly.",
    gradient: "linear-gradient(135deg, #14080d 0%, #2a0a1e 50%, #1a0814 100%)",
    accentColor: "#a78bfa",
    mockup: "voice",
  },
  {
    eyebrow: "Data Export",
    headline: "Export booking data to CSV in one click.",
    body: "Download filtered booking records as structured CSV files for use in Excel, Google Sheets, or your own analysis tools. Rate-limited to ensure fair access for all subscribers.",
    gradient: "linear-gradient(135deg, #0a1400 0%, #1a2a00 50%, #0f1e00 100%)",
    accentColor: "#f59e0b",
    mockup: "export",
  },
];

/* ── Pricing ──────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    description: "For occasional lookups",
    cta: "Get started",
    ctaStyle: "ghost",
    features: [
      "3 searches per day",
      "3 parishes covered",
      "Basic name search",
      "Public bond data only",
    ],
    highlight: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/ month",
    description: "For attorneys & bondsmen",
    cta: "Start free trial",
    ctaStyle: "primary",
    features: [
      "Unlimited searches",
      "All 7 parishes",
      "Voice search",
      "Email alerts — 10 watches",
      "CSV export",
      "Bond change history",
      "Priority data refresh",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/ month",
    description: "For agencies & law firms",
    cta: "Contact sales",
    ctaStyle: "ghost",
    features: [
      "Everything in Professional",
      "Unlimited alert watches",
      "API access",
      "Bulk CSV export",
      "Dedicated data pipeline",
      "SLA & priority support",
      "Custom parish integrations",
    ],
    highlight: false,
  },
];

/* ── Stats ────────────────────────────────────────────────── */
const STATS = [
  { value: "7", label: "Parishes Covered" },
  { value: "30m", label: "Data Refresh Cycle" },
  { value: "99.7%", label: "Uptime SLA" },
  { value: "1M+", label: "Bookings Indexed" },
];

/* ── Parish data ──────────────────────────────────────────── */
const PARISHES_DATA = [
  { name: "Jefferson", type: "Zuercher Playwright", bond: true, bookings: 1105, status: "live" },
  { name: "St. Mary", type: "Most Wanted CMS", bond: true, bookings: 241, status: "live" },
  { name: "Allen", type: "Most Wanted CMS", bond: true, bookings: 87, status: "live" },
  { name: "Evangeline", type: "Most Wanted CMS", bond: true, bookings: 63, status: "live" },
  { name: "Plaquemines", type: "LA VINE / Appriss", bond: false, bookings: 44, status: "partial" },
  { name: "St. Bernard", type: "LA VINE / Appriss", bond: false, bookings: 38, status: "partial" },
  { name: "Orleans", type: "Appriss OCV API", bond: false, bookings: 892, status: "partial" },
];

/* ── App Mockup Components ────────────────────────────────── */
function SearchMockup() {
  return (
    <div style={{ background: "var(--bc-surface)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)", padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", width: "100%", maxWidth: "480px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bc-surface2)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-md)", padding: "0.65rem 1rem", marginBottom: "1rem" }}>
        <Search size={14} style={{ color: "var(--bc-text-3)" }} />
        <span style={{ color: "var(--bc-text-2)", fontFamily: "var(--font-body)" }}>JOHNSON, MARCUS</span>
        <Mic size={13} style={{ color: "var(--bc-cyan)", marginLeft: "auto" }} />
      </div>
      {[
        { name: "JOHNSON, MARCUS D.", parish: "Jefferson", bond: "$15,000", charge: "THEFT", status: "Held" },
        { name: "JOHNSON, MARCUS A.", parish: "St. Mary", bond: "$5,500", charge: "DWI", status: "Released" },
        { name: "JOHNSON, MARCUS T.", parish: "Allen", bond: "No Bond", charge: "POSSESSION", status: "Held" },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0.875rem", marginBottom: "0.4rem", background: "var(--bc-surface2)", border: "1px solid var(--bc-border)", borderRadius: "var(--radius-md)", borderLeft: `3px solid ${r.status === "Released" ? "var(--bc-green)" : "var(--bc-amber)"}` }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--bc-text)", marginBottom: "0.2rem" }}>{r.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--bc-text-3)" }}>{r.parish} · {r.charge}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--bc-cyan)", fontWeight: 600, fontSize: "0.82rem" }}>{r.bond}</div>
            <div style={{ fontSize: "0.65rem", color: r.status === "Released" ? "var(--bc-green)" : "var(--bc-amber)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.status}</div>
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", fontSize: "0.65rem", color: "var(--bc-text-3)", marginTop: "0.75rem" }}>3 results · Updated 4 minutes ago</div>
    </div>
  );
}

function AlertMockup() {
  return (
    <div style={{ background: "var(--bc-surface)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: "480px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <Bell size={15} style={{ color: "var(--bc-green)" }} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem" }}>Active Watches</span>
        <span style={{ marginLeft: "auto", background: "var(--bc-green-dim)", color: "var(--bc-green)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 600, padding: "0.15rem 0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>3 Active</span>
      </div>
      {[
        { name: "JOHNSON, MARCUS D.", event: "Bond changed: $15,000 → $8,500", time: "2 hrs ago", color: "var(--bc-cyan)" },
        { name: "WILLIAMS, DEREK A.", event: "Released from custody", time: "Yesterday", color: "var(--bc-green)" },
        { name: "THIBODAUX, PAUL J.", event: "Charge added: BATTERY", time: "3 days ago", color: "var(--bc-amber)" },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.875rem", marginBottom: "0.4rem", background: "var(--bc-surface2)", border: "1px solid var(--bc-border)", borderRadius: "var(--radius-md)" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: a.color, flexShrink: 0, marginTop: "0.35rem" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--bc-text)", marginBottom: "0.2rem" }}>{a.name}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--bc-text-2)" }}>{a.event}</div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--bc-text-3)", flexShrink: 0 }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}

function VoiceMockup() {
  return (
    <div style={{ background: "var(--bc-surface)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: "480px", textAlign: "center" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--bc-text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Listening...</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "48px" }}>
          {[12, 28, 40, 20, 44, 32, 16, 36, 24, 40, 18, 30, 44, 22, 38].map((h, i) => (
            <div key={i} style={{ width: "4px", height: `${h}px`, borderRadius: "2px", background: `rgba(167, 139, 250, ${0.4 + (h / 44) * 0.6})` }} />
          ))}
        </div>
      </div>
      <div style={{ background: "var(--bc-surface2)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem", marginBottom: "1rem", textAlign: "left" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--bc-text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>You said</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--bc-text)" }}>"Show me DWI arrests in Jefferson this week"</div>
      </div>
      <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem", textAlign: "left" }}>
        <div style={{ fontSize: "0.7rem", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>AI Normalized</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--bc-text-2)" }}>charge: "DWI" · parish: "Jefferson" · date: last 7 days</div>
      </div>
      <div style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--bc-text-3)" }}>14 results found · 0.3s</div>
    </div>
  );
}

function ExportMockup() {
  return (
    <div style={{ background: "var(--bc-surface)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: "480px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <Download size={15} style={{ color: "var(--bc-amber)" }} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem" }}>Export Bookings</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
        {["Jefferson Parish", "Last 7 days", "Bond > $10,000", "DWI"].map(tag => (
          <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", background: "var(--bc-surface2)", border: "1px solid var(--bc-border-strong)", color: "var(--bc-text-2)" }}>{tag}</span>
        ))}
      </div>
      <div style={{ background: "var(--bc-surface2)", borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: "1rem", border: "1px solid var(--bc-border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--bc-border)", background: "rgba(255,255,255,0.03)" }}>
          {["Name", "Charge", "Bond"].map(h => (
            <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--bc-text-3)" }}>{h}</span>
          ))}
        </div>
        {[["BROUSSARD, T.", "DWI", "$12,500"], ["FONTENOT, R.", "DWI 2nd", "$25,000"], ["LANDRY, M.", "DWI", "$10,000"]].map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0.5rem 0.75rem", borderBottom: i < 2 ? "1px solid var(--bc-border)" : "none" }}>
            {row.map((cell, j) => (
              <span key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: j === 2 ? "var(--bc-cyan)" : "var(--bc-text-2)" }}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--bc-text-3)" }}>47 records · 3.2 KB</span>
        <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--bc-amber)", color: "#000", border: "none", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
          <Download size={13} /> Download CSV
        </button>
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, React.ReactNode> = {
  search: <SearchMockup />,
  alert: <AlertMockup />,
  voice: <VoiceMockup />,
  export: <ExportMockup />,
};

/* ── Nav ──────────────────────────────────────────────────── */
function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(8,13,20,0.92)" : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: scrolled ? "1px solid var(--bc-border)" : "1px solid transparent", transition: "all 0.2s ease" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", height: "64px", gap: "2rem" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bc-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--bc-text)", letterSpacing: "-0.02em" }}>BondCurrent</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
          {[{ label: "Features", href: "#features" }, { label: "Parishes", href: "#parishes" }, { label: "Pricing", href: "#pricing" }].map(link => (
            <a key={link.label} href={link.href} style={{ padding: "0.4rem 0.875rem", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 500, color: "var(--bc-text-2)", textDecoration: "none", transition: "color 0.15s, background 0.15s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--bc-text)"; (e.target as HTMLElement).style.background = "var(--bc-surface2)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--bc-text-2)"; (e.target as HTMLElement).style.background = "transparent"; }}
            >{link.label}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <Link href="/bookings" style={{ padding: "0.45rem 1rem", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 500, color: "var(--bc-text-2)", textDecoration: "none", border: "1px solid var(--bc-border-strong)" }}>Log in</Link>
          <Link href="/bookings" style={{ padding: "0.45rem 1.1rem", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: 600, color: "#fff", textDecoration: "none", background: "var(--bc-blue)" }}>Search free</Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", color: "var(--bc-text-2)", cursor: "pointer", padding: "0.25rem", display: "none" }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}

/* ── Ticker ───────────────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ overflow: "hidden", width: "100%", position: "relative", padding: "0.5rem 0" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(to right, var(--bc-bg), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(to left, var(--bc-bg), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ display: "flex", gap: "0.75rem", animation: "bc-ticker 40s linear infinite", width: "max-content" }}>
        {items.map((item, i) => (
          <div key={i} style={{ flexShrink: 0, padding: "0.5rem 1rem", background: "var(--bc-surface)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--bc-text-2)", whiteSpace: "nowrap", cursor: "pointer" }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
export default function MarketingHome() {
  return (
    <div style={{ background: "var(--bc-bg)", color: "var(--bc-text)", overflowX: "hidden" }}>
      <style>{`
        @keyframes bc-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <MarketingNav />

      {/* Hero */}
      <section style={{ paddingTop: "140px", paddingBottom: "80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "400px", background: "radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", padding: "0.35rem 0.875rem", background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: "999px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--bc-cyan)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--bc-cyan)" }}>Louisiana · 7 Parishes · Live Data</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "1.5rem", maxWidth: "900px", marginLeft: "auto", marginRight: "auto" }}>
            Find any inmate.<br />
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #22d3ee 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Track every bond.</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "var(--bc-text-2)", lineHeight: 1.7, maxWidth: "560px", marginLeft: "auto", marginRight: "auto", marginBottom: "2.5rem" }}>
            Real-time bail bond search and alert platform for Louisiana parishes. Updated every 30 minutes. Voice-enabled.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "4rem" }}>
            <Link href="/bookings" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", borderRadius: "var(--radius-md)", background: "var(--bc-blue)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" }}>
              Search now <ArrowRight size={16} />
            </Link>
            <a href="#pricing" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--bc-text-2)", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.95rem", textDecoration: "none", border: "1px solid var(--bc-border-strong)" }}>
              View pricing <ChevronRight size={16} />
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2.5rem", marginBottom: "4rem" }}>
            {STATS.map(stat => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--bc-text)", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--bc-text-3)", marginTop: "0.35rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <Ticker />
      </section>

      {/* Feature Sections */}
      <section id="features" style={{ paddingTop: "80px" }}>
        {FEATURES.map((feature, i) => (
          <div key={feature.eyebrow} style={{ padding: "80px 0", borderTop: "1px solid var(--bc-border)" }}>
            <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
              {/* Text */}
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem", padding: "0.25rem 0.75rem", background: `${feature.accentColor}15`, border: `1px solid ${feature.accentColor}30`, borderRadius: "999px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: feature.accentColor }}>{feature.eyebrow}</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "1.25rem", color: "var(--bc-text)" }}>
                  {feature.headline}
                </h2>
                <p style={{ fontSize: "1rem", color: "var(--bc-text-2)", lineHeight: 1.75, marginBottom: "1.5rem" }}>{feature.body}</p>
                <Link href="/bookings" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: feature.accentColor, textDecoration: "none" }}>
                  Try it free <ArrowRight size={14} />
                </Link>
              </div>
              {/* Mockup */}
              <div style={{ order: i % 2 === 0 ? 2 : 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem", borderRadius: "var(--radius-lg)", background: feature.gradient, border: "1px solid var(--bc-border)", minHeight: "320px" }}>
                {MOCKUP_MAP[feature.mockup]}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Parishes */}
      <section id="parishes" style={{ padding: "100px 0", borderTop: "1px solid var(--bc-border)", background: "var(--bc-surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem", padding: "0.25rem 0.75rem", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "999px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--bc-blue)" }}>Coverage</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
              7 Louisiana parishes.<br />One unified search.
            </h2>
            <p style={{ color: "var(--bc-text-2)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
              We scrape and normalize data from multiple parish platforms so you never have to visit each site individually.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {PARISHES_DATA.map(parish => (
              <div key={parish.name} style={{ padding: "1.25rem 1.5rem", background: "var(--bc-surface2)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: parish.status === "live" ? "var(--bc-green-dim)" : "var(--bc-amber-dim)", border: `1px solid ${parish.status === "live" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={15} style={{ color: parish.status === "live" ? "var(--bc-green)" : "var(--bc-amber)" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{parish.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--bc-text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{parish.type}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "0.9rem", color: "var(--bc-cyan)" }}>{parish.bookings.toLocaleString()}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--bc-text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{parish.bond ? "Bond data" : "No bond"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "100px 0", borderTop: "1px solid var(--bc-border)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem", padding: "0.25rem 0.75rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "999px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--bc-amber)" }}>Pricing</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>Simple, transparent pricing.</h2>
            <p style={{ color: "var(--bc-text-2)", fontSize: "1rem", maxWidth: "420px", margin: "0 auto", lineHeight: 1.7 }}>Start free. Upgrade when you need more searches, alerts, or API access.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", maxWidth: "900px", margin: "0 auto" }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{ padding: "2rem", background: plan.highlight ? "var(--bc-surface2)" : "var(--bc-surface)", border: plan.highlight ? "1px solid var(--bc-blue)" : "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)", position: "relative", boxShadow: plan.highlight ? "0 0 0 1px rgba(37,99,235,0.3), 0 8px 32px rgba(37,99,235,0.15)" : "none" }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--bc-blue)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.25rem 0.875rem", borderRadius: "999px" }}>Most Popular</div>
                )}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{plan.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--bc-text-3)", marginBottom: "1rem" }}>{plan.description}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "2.75rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--bc-text)" }}>{plan.price}</span>
                    <span style={{ fontSize: "0.875rem", color: "var(--bc-text-3)" }}>{plan.period}</span>
                  </div>
                </div>
                <Link href="/bookings" style={{ display: "block", textAlign: "center", padding: "0.7rem 1rem", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", marginBottom: "1.5rem", background: plan.ctaStyle === "primary" ? "var(--bc-blue)" : "transparent", color: plan.ctaStyle === "primary" ? "#fff" : "var(--bc-text-2)", border: plan.ctaStyle === "primary" ? "none" : "1px solid var(--bc-border-strong)" }}>
                  {plan.cta}
                </Link>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.83rem", color: "var(--bc-text-2)" }}>
                      <Check size={13} style={{ color: "var(--bc-green)", flexShrink: 0, marginTop: "0.2rem" }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "80px 0", borderTop: "1px solid var(--bc-border)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem", padding: "3rem 3.5rem", background: "var(--bc-surface)", border: "1px solid var(--bc-border-strong)", borderRadius: "var(--radius-lg)" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>Start searching Louisiana parishes today.</h2>
              <p style={{ color: "var(--bc-text-2)", fontSize: "0.95rem", lineHeight: 1.6 }}>Free to start. No credit card required.</p>
            </div>
            <Link href="/bookings" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 2rem", borderRadius: "var(--radius-md)", background: "var(--bc-blue)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "1rem", textDecoration: "none", flexShrink: 0 }}>
              Search free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--bc-border)", padding: "3rem 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--bc-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={14} style={{ color: "#fff" }} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "var(--bc-text)" }}>BondCurrent</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {["Privacy", "Terms", "API Docs", "Status"].map(link => (
              <a key={link} href="#" style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--bc-text-3)", textDecoration: "none" }}>{link}</a>
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--bc-text-3)" }}>© 2026 BondCurrent · Louisiana Parish Monitor</div>
        </div>
      </footer>
    </div>
  );
}
