/*
 * BondCurrent — Marketing Landing Page
 * Legal Professional Edition
 * Light, authoritative, trustworthy design
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  MapPin,
  Menu,
  Mic,
  Phone,
  PhoneCall,
  Scale,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// ── Data ───────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Live Inmate Lookup",
    desc: "Query Louisiana parish jail rosters in real time. Returns name, booking number, charges, and bond amount where the jail makes that data available online.",
  },
  {
    icon: Shield,
    title: "Caller Qualification",
    desc: "Evaluates bond amount and caller-stated budget to produce a QUALIFIED, REVIEW, or DECLINED recommendation. Final decisions remain with your licensed agent.",
  },
  {
    icon: Mic,
    title: "Voice Agent Integration",
    desc: "A single POST endpoint integrates with Vapi, Retell, Bland, or any telephony platform. Returns a structured JSON response with a ready-to-speak voice prompt.",
  },
  {
    icon: Zap,
    title: "Fast Response Times",
    desc: "Cached rosters reduce latency for repeat lookups. Live scrape fallback fires automatically when cached data is stale. Response times vary by parish source.",
  },
  {
    icon: FileText,
    title: "Structured Responses",
    desc: "Every API response includes bond details, a qualification decision, and a natural-language voice prompt formatted for text-to-speech delivery.",
  },
  {
    icon: Lock,
    title: "Data Minimization",
    desc: "No PII is stored beyond the session. All data is encrypted in transit. Designed for bail bond professionals who handle sensitive client information.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Caller Dials In",
    desc: "A family member or attorney calls your agency's AI voice line and provides the inmate's name and parish.",
  },
  {
    num: "02",
    title: "BondCurrent Queries the Roster",
    desc: "Your voice agent POSTs to our API. We query the live parish jail roster and return bond details where available.",
  },
  {
    num: "03",
    title: "Qualification Assessment",
    desc: "The API calculates the 10% premium and returns a qualification recommendation based on the caller's stated budget.",
  },
  {
    num: "04",
    title: "Agent Reviews and Decides",
    desc: "Qualified callers are transferred to a licensed agent who makes the final decision. Unqualified callers receive a clear, professional explanation.",
  },
];

const PARISHES = [
  { name: "St. John the Baptist", bond: true,  status: "live" },
  { name: "St. Mary",             bond: true,  status: "live" },
  { name: "Allen",                bond: true,  status: "live" },
  { name: "Evangeline",           bond: true,  status: "live" },
  { name: "Jefferson",            bond: true,  status: "live" },
  { name: "Ascension",            bond: false, status: "live" },
  { name: "Assumption",           bond: false, status: "live" },
  { name: "St. Charles",          bond: false, status: "live" },
  { name: "St. James",            bond: false, status: "live" },
  { name: "Plaquemines",          bond: false, status: "live" },
  { name: "St. Bernard",          bond: false, status: "live" },
  { name: "Orleans",              bond: false, status: "live" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$199",
    period: "/mo",
    desc: "For independent bondsmen handling up to 500 calls per month.",
    features: ["500 screener calls/mo", "5 parishes", "JSON API access", "1 voice agent line", "Email support"],
    cta: "Request Access",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$499",
    period: "/mo",
    desc: "For growing agencies that need full parish coverage and priority support.",
    features: [
      "2,000 screener calls/mo",
      "All 12 parishes",
      "3 voice agent lines",
      "Call logs & transcripts",
      "Webhook notifications",
      "Priority support",
    ],
    cta: "Request Access",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$999",
    period: "/mo",
    desc: "For multi-agency operations with higher call volumes and custom integrations.",
    features: [
      "10,000 screener calls/mo",
      "Unlimited voice agent lines",
      "Full Louisiana parish access",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "We were manually looking up bookings before every call. BondCurrent cut our intake time significantly. We handle more inquiries now with the same staff.",
    name: "Marcus T.",
    title: "Owner, River Parishes Bail Bonds",
    location: "St. John the Baptist Parish",
  },
  {
    quote: "The voice agent integration took one afternoon to set up. Now our AI handles the initial lookup and qualification check. We only pick up for callers who are likely to qualify.",
    name: "Desiree F.",
    title: "Operations Manager, Gulf Coast Bonding",
    location: "St. Mary Parish",
  },
  {
    quote: "For the parishes where bond data is available online, the lookups have been accurate and fast. It's become a reliable first step in our intake process.",
    name: "Kevin B.",
    title: "Licensed Bail Agent",
    location: "Allen & Evangeline Parishes",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function Navbar({ user, onLogin, onDashboard }: {
  user: any;
  onLogin: () => void;
  onDashboard: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const NAV_ITEMS = ["Features", "How It Works", "Coverage", "Pricing"];
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid hsl(var(--border))",
        boxShadow: "0 1px 4px rgba(30,58,95,0.06)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              background: "var(--bc-navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Scale size={16} color="white" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
              color: "var(--bc-navy)",
            }}
          >
            Bond<span style={{ color: "var(--bc-teal)" }}>Current</span>
          </span>
        </div>

        {/* Desktop nav links */}
        <nav
          style={{ alignItems: "center", gap: "0.25rem" }}
          className="bc-desktop-only"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "hsl(var(--muted-foreground))",
                textDecoration: "none",
                borderRadius: 4,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--bc-navy)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {user ? (
            <button onClick={onDashboard} className="bc-btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.125rem" }}>
              Dashboard <ChevronRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={onLogin}
                className="bc-desktop-only"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "hsl(var(--muted-foreground))",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.4rem 0.75rem",
                }}
              >
                Sign In
              </button>
              <button onClick={onLogin} className="bc-btn-primary bc-desktop-only" style={{ fontSize: "0.875rem", padding: "0.5rem 1.125rem" }}>
                Request Access <ArrowRight size={13} />
              </button>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{
              width: 38,
              height: 38,
              borderRadius: 6,
              border: "1.5px solid hsl(var(--border))",
              background: mobileOpen ? "var(--bc-navy-dim)" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: mobileOpen ? "var(--bc-navy)" : "hsl(var(--foreground))",
              transition: "all 0.15s",
              display: "none",
            }}
            className="bc-hamburger"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            zIndex: 99,
            borderTop: "1px solid hsl(var(--border))",
            background: "rgba(255,255,255,0.98)",
            padding: "1rem 1.25rem 1.5rem",
            boxShadow: "0 8px 24px rgba(30,58,95,0.12)",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.125rem", marginBottom: "1.25rem" }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={closeMobile}
                style={{
                  display: "block",
                  padding: "0.875rem 0.75rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "hsl(var(--foreground))",
                  textDecoration: "none",
                  borderRadius: 4,
                  borderBottom: "1px solid hsl(var(--border))",
                  transition: "background 0.1s, color 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bc-navy-dim)";
                  (e.currentTarget as HTMLElement).style.color = "var(--bc-navy)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
                }}
              >
                {item}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {user ? (
              <button
                onClick={() => { closeMobile(); onDashboard(); }}
                className="bc-btn-primary"
                style={{ justifyContent: "center", fontSize: "0.9375rem", padding: "0.75rem" }}
              >
                Go to Dashboard <ChevronRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => { closeMobile(); onLogin(); }}
                  className="bc-btn-primary"
                  style={{ justifyContent: "center", fontSize: "0.9375rem", padding: "0.75rem" }}
                >
                  Request Access <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => { closeMobile(); onLogin(); }}
                  className="bc-btn-outline"
                  style={{ justifyContent: "center", fontSize: "0.9375rem", padding: "0.75rem" }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function Hero({ onLogin }: { onLogin: () => void }) {
  return (
    <section
      id="hero"
      style={{
        position: "relative",
        paddingTop: "64px",
        overflow: "hidden",
        background: "hsl(var(--background))",
      }}
    >
      {/* Subtle background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 60% 0%, rgba(30,58,95,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 10% 80%, rgba(13,115,119,0.04) 0%, transparent 60%)
          `,
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Two-column layout on desktop, stacked on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: "3rem",
            alignItems: "center",
            padding: "5rem 0 4rem",
          }}
          className="bc-hero-grid"
        >
          {/* Left: copy */}
          <div>
            {/* Status badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.3rem 0.75rem",
                borderRadius: 4,
                background: "var(--bc-navy-dim)",
                border: "1px solid rgba(30,58,95,0.15)",
                marginBottom: "1.75rem",
              }}
            >
              <span className="bc-status-dot live bc-pulse" />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--bc-navy)",
                }}
              >
                Live · 12 Louisiana Parishes
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                marginBottom: "1.25rem",
                color: "var(--bc-navy)",
                lineHeight: 1.1,
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              Bond Screening
              <br />
              for Louisiana
              <br />
              <span style={{ color: "var(--bc-teal)" }}>Bail Bondsmen.</span>
            </h1>

            {/* Sub-headline */}
            <p
              style={{
                maxWidth: "480px",
                fontSize: "1.0625rem",
                lineHeight: 1.75,
                color: "hsl(var(--muted-foreground))",
                marginBottom: "2rem",
                fontWeight: 400,
              }}
            >
              BondCurrent connects your AI voice agent to live Louisiana parish jail rosters.
              Look up inmates, assess caller qualification, and route ready clients — before a licensed agent picks up.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <button
                onClick={onLogin}
                className="bc-btn-primary"
                style={{ fontSize: "0.9375rem", padding: "0.75rem 1.75rem" }}
              >
                Request Access <ArrowRight size={15} />
              </button>
              <a
                href="#how-it-works"
                className="bc-btn-outline"
                style={{ fontSize: "0.9375rem", padding: "0.75rem 1.75rem", textDecoration: "none" }}
              >
                See How It Works
              </a>
            </div>

            {/* Trust signals */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { icon: MapPin,  text: "12 Parishes" },
                { icon: Clock,   text: "Live Data" },
                { icon: Shield,  text: "Data Minimization" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontSize: "0.8125rem",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <Icon size={13} color="var(--bc-teal)" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: API preview card */}
          <div>
            <div
              style={{
                borderRadius: 10,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                overflow: "hidden",
                boxShadow: "var(--elevate-3)",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "var(--bc-navy)",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Activity size={13} color="rgba(255,255,255,0.6)" />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: "0.06em",
                  }}
                >
                  POST /api/v1/voice-screener
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "rgba(134,239,172,0.9)",
                  }}
                >
                  200 OK
                </span>
              </div>
              {/* Code */}
              <div
                style={{
                  padding: "1.25rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.75,
                  background: "#1a2740",
                  color: "#94a3b8",
                }}
              >
                <div><span style={{ color: "#64748b" }}>{"// Request"}</span></div>
                <div><span style={{ color: "#cbd5e1" }}>{"{"}</span></div>
                <div style={{ paddingLeft: "1.25rem" }}>
                  <span style={{ color: "#93c5fd" }}>"inmate_name"</span>
                  <span style={{ color: "#64748b" }}>: </span>
                  <span style={{ color: "#86efac" }}>"Johnson, Marcus"</span><span style={{ color: "#64748b" }}>,</span>
                </div>
                <div style={{ paddingLeft: "1.25rem" }}>
                  <span style={{ color: "#93c5fd" }}>"parish"</span>
                  <span style={{ color: "#64748b" }}>: </span>
                  <span style={{ color: "#86efac" }}>"St. John the Baptist"</span>
                </div>
                <div><span style={{ color: "#cbd5e1" }}>{"}"}</span></div>
                <div style={{ marginTop: "0.75rem" }}><span style={{ color: "#64748b" }}>{"// Response"}</span></div>
                <div><span style={{ color: "#cbd5e1" }}>{"{"}</span></div>
                <div style={{ paddingLeft: "1.25rem" }}>
                  <span style={{ color: "#93c5fd" }}>"screener_decision"</span>
                  <span style={{ color: "#64748b" }}>: </span>
                  <span style={{ color: "#34d399" }}>"QUALIFIED"</span><span style={{ color: "#64748b" }}>,</span>
                </div>
                <div style={{ paddingLeft: "1.25rem" }}>
                  <span style={{ color: "#93c5fd" }}>"total_bond_amount"</span>
                  <span style={{ color: "#64748b" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>25000</span><span style={{ color: "#64748b" }}>,</span>
                </div>
                <div style={{ paddingLeft: "1.25rem" }}>
                  <span style={{ color: "#93c5fd" }}>"calculated_premium"</span>
                  <span style={{ color: "#64748b" }}>: </span>
                  <span style={{ color: "#fbbf24" }}>2500</span><span style={{ color: "#64748b" }}>,</span>
                </div>
                <div style={{ paddingLeft: "1.25rem" }}>
                  <span style={{ color: "#93c5fd" }}>"voice_prompt"</span>
                  <span style={{ color: "#64748b" }}>: </span>
                  <span style={{ color: "#86efac" }}>"Marcus is in custody..."</span>
                </div>
                <div><span style={{ color: "#cbd5e1" }}>{"}"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero grid override */}
      <style>{`
        @media (max-width: 768px) {
          .bc-hero-grid {
            grid-template-columns: 1fr !important;
            padding: 3rem 0 2rem !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </section>
  );
}

// ── Stats bar ──────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: "12",    label: "Parishes Indexed" },
    { value: "5",     label: "With Bond Data" },
    { value: "30m",   label: "Cache Refresh Cycle" },
    { value: "REST",  label: "API Protocol" },
  ];

  return (
    <div
      style={{
        borderTop: "1px solid hsl(var(--border))",
        borderBottom: "1px solid hsl(var(--border))",
        background: "var(--bc-navy)",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "1.5rem 1.25rem",
              textAlign: "center",
              borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#ffffff",
                lineHeight: 1,
                marginBottom: "0.35rem",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .bc-stats-bar-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

// ── Features ───────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="bc-section" style={{ background: "hsl(var(--background))" }}>
      <div className="container">
        <div style={{ marginBottom: "3rem" }}>
          <div className="bc-rule-amber" />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--bc-teal)",
              marginBottom: "0.75rem",
            }}
          >
            Platform Capabilities
          </p>
          <h2 style={{ color: "var(--bc-navy)", maxWidth: 520, marginBottom: "1rem" }}>
            What BondCurrent does
          </h2>
          <p style={{ maxWidth: 540, color: "hsl(var(--muted-foreground))", fontSize: "1rem", lineHeight: 1.7 }}>
            A focused set of tools for bail bond agencies that want to automate the first step of their intake process.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "1.5rem",
                boxShadow: "var(--elevate-1)",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--elevate-2)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--elevate-1)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "var(--bc-navy-dim)",
                  border: "1px solid rgba(30,58,95,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <f.icon size={18} color="var(--bc-navy)" />
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--bc-navy)", fontFamily: "var(--font-sans)" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.65, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how-it-works" className="bc-section" style={{ background: "hsl(var(--secondary))", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}>
      <div className="container">
        <div style={{ marginBottom: "3rem" }}>
          <div className="bc-rule-amber" />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--bc-teal)",
              marginBottom: "0.75rem",
            }}
          >
            Workflow
          </p>
          <h2 style={{ color: "var(--bc-navy)", maxWidth: 480 }}>
            How a screened call works
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ position: "relative" }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "-0.75rem",
                    width: "1.5rem",
                    height: "1px",
                    background: "hsl(var(--border))",
                    display: "none",
                  }}
                  className="bc-step-connector"
                />
              )}
              <div
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  padding: "1.5rem",
                  boxShadow: "var(--elevate-1)",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--bc-teal)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--bc-navy)", fontFamily: "var(--font-sans)" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div
          style={{
            marginTop: "2.5rem",
            padding: "1rem 1.25rem",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderLeft: "3px solid var(--bc-navy)",
            borderRadius: 6,
            fontSize: "0.8125rem",
            color: "hsl(var(--muted-foreground))",
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: "hsl(var(--foreground))" }}>Note:</strong> BondCurrent provides data and qualification recommendations as a tool to assist licensed bail bond agents. All final bonding decisions are made by the licensed agent, not by this platform. Bond data availability varies by parish — some jails do not publish bond amounts online.
        </div>
      </div>
    </section>
  );
}

// ── Coverage ───────────────────────────────────────────────────────────────────

function Coverage() {
  return (
    <section id="coverage" className="bc-section" style={{ background: "hsl(var(--background))" }}>
      <div className="container">
        <div style={{ marginBottom: "3rem" }}>
          <div className="bc-rule-amber" />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--bc-teal)",
              marginBottom: "0.75rem",
            }}
          >
            Parish Coverage
          </p>
          <h2 style={{ color: "var(--bc-navy)", maxWidth: 480, marginBottom: "1rem" }}>
            12 Louisiana parishes indexed
          </h2>
          <p style={{ maxWidth: 540, color: "hsl(var(--muted-foreground))", fontSize: "0.9375rem", lineHeight: 1.7 }}>
            We index jail rosters across Louisiana's River Parishes and surrounding jurisdictions. Bond amount availability depends on what each parish publishes online — 5 parishes currently include bond data in their public roster.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          {PARISHES.map((p) => (
            <div
              key={p.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                boxShadow: "var(--elevate-1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className={`bc-status-dot ${p.status} bc-pulse`} />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>
                  {p.name}
                </span>
              </div>
              <span
                className={p.bond ? "bc-badge bc-badge-green" : "bc-badge bc-badge-slate"}
                style={{ flexShrink: 0 }}
              >
                {p.bond ? "Bond ✓" : "Custody"}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
            <span className="bc-badge bc-badge-green" style={{ fontSize: "0.6rem" }}>Bond ✓</span>
            Bond amount included in public roster
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
            <span className="bc-badge bc-badge-slate" style={{ fontSize: "0.6rem" }}>Custody</span>
            Custody status only — bond requires manual call to jail
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section
      className="bc-section"
      style={{
        background: "hsl(var(--secondary))",
        borderTop: "1px solid hsl(var(--border))",
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "3rem" }}>
          <div className="bc-rule-amber" />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--bc-teal)",
              marginBottom: "0.75rem",
            }}
          >
            From the Field
          </p>
          <h2 style={{ color: "var(--bc-navy)", maxWidth: 480 }}>
            What agents say
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "1.5rem",
                boxShadow: "var(--elevate-1)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "hsl(var(--foreground))", margin: 0, flex: 1, fontStyle: "italic" }}>
                "{t.quote}"
              </p>
              <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "0.875rem" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--bc-navy)" }}>{t.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>{t.title}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--bc-teal)", marginTop: "0.15rem" }}>{t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────────

function Pricing({ onLogin }: { onLogin: () => void }) {
  return (
    <section
      id="pricing"
      className="bc-section"
      style={{
        background: "hsl(var(--background))",
        borderTop: "1px solid hsl(var(--border))",
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "3rem" }}>
          <div className="bc-rule-amber" />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--bc-teal)",
              marginBottom: "0.75rem",
            }}
          >
            Pricing
          </p>
          <h2 style={{ color: "var(--bc-navy)", maxWidth: 480, marginBottom: "0.75rem" }}>
            Straightforward plans
          </h2>
          <p style={{ maxWidth: 480, color: "hsl(var(--muted-foreground))", fontSize: "0.9375rem", lineHeight: 1.7 }}>
            All plans include a 14-day trial period. No credit card required to start.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: "hsl(var(--card))",
                border: plan.highlight ? `2px solid var(--bc-navy)` : "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "1.75rem",
                boxShadow: plan.highlight ? "var(--elevate-2)" : "var(--elevate-1)",
                position: "relative",
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--bc-navy)",
                    color: "white",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "0.25rem 0.875rem",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", fontWeight: 700, color: "var(--bc-navy)", letterSpacing: "-0.02em" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginTop: "0.5rem", lineHeight: 1.5 }}>
                  {plan.desc}
                </p>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>
                    <CheckCircle2 size={15} color="var(--bc-teal)" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={onLogin}
                className={plan.highlight ? "bc-btn-primary" : "bc-btn-outline"}
                style={{ width: "100%", justifyContent: "center", fontSize: "0.9375rem", padding: "0.75rem" }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ────────────────────────────────────────────────────────────────────────

function CTA({ onLogin }: { onLogin: () => void }) {
  return (
    <section
      style={{
        background: "var(--bc-navy)",
        padding: "5rem 0",
      }}
    >
      <div className="container" style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 10,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            marginBottom: "1.5rem",
          }}
        >
          <Phone size={24} color="white" />
        </div>
        <h2 style={{ maxWidth: 520, margin: "0 auto 1rem", color: "white", fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}>
          Ready to streamline your intake process?
        </h2>
        <p
          style={{
            maxWidth: 420,
            margin: "0 auto 2rem",
            color: "rgba(255,255,255,0.7)",
            fontSize: "1rem",
            lineHeight: 1.7,
          }}
        >
          Request access and we'll walk you through the API integration with your voice platform.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={onLogin}
            style={{
              background: "white",
              color: "var(--bc-navy)",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "0.75rem 2rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            Request Access <ArrowRight size={15} />
          </button>
          <a
            href="mailto:hello@bondcurrent.com"
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.85)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 2rem",
              fontSize: "0.9375rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
          >
            Contact Us
          </a>
        </div>
        <p style={{ marginTop: "1.25rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" }}>
          14-day trial · No credit card required
        </p>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      style={{
        background: "hsl(var(--card))",
        borderTop: "1px solid hsl(var(--border))",
        padding: "2rem 0",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Scale size={14} color="var(--bc-navy)" />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "var(--bc-navy)",
            }}
          >
            Bond<span style={{ color: "var(--bc-teal)" }}>Current</span>
          </span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {["Privacy Policy", "Terms of Service", "API Docs", "Contact"].map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontSize: "0.8125rem",
                color: "hsl(var(--muted-foreground))",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--bc-navy)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.04em",
          }}
        >
          © 2026 BondCurrent · Louisiana
        </div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = () => { window.location.href = getLoginUrl(); };
  const handleDashboard = () => setLocation("/dashboard");

  return (
    <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }}>
      <Navbar user={user} onLogin={handleLogin} onDashboard={handleDashboard} />
      <div style={{ paddingTop: "64px" }}>
        <Hero onLogin={handleLogin} />
        <StatsBar />
        <Features />
        <HowItWorks />
        <Coverage />
        <Testimonials />
        <Pricing onLogin={handleLogin} />
        <CTA onLogin={handleLogin} />
        <Footer />
      </div>
    </div>
  );
}
