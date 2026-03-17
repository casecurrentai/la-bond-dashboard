/**
 * BondCurrent — Marketing Landing Page
 * Law Enforcement Edition
 * Dark, authoritative, tactical design
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Activity,
  AlertTriangle,
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
  Shield,
  ShieldCheck,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// ── Helpers ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Live Inmate Lookup",
    desc: "Query Louisiana parish jail rosters in real-time. Name, booking number, charges, and bond amount — returned in under 500ms.",
  },
  {
    icon: Shield,
    title: "Instant Qualification",
    desc: "Automated risk assessment evaluates bond amount, charge severity, and caller budget to deliver a clear QUALIFIED / REVIEW / DECLINED decision.",
  },
  {
    icon: Mic,
    title: "Voice Agent Ready",
    desc: "A single POST endpoint integrates with Vapi, Retell, Bland, or any telephony platform. No custom parsing. No glue code.",
  },
  {
    icon: Zap,
    title: "Sub-Second Response",
    desc: "Cached rosters refresh every 30 minutes. Live scrape fallback fires automatically. Your callers never wait.",
  },
  {
    icon: FileText,
    title: "TTS Voice Prompts",
    desc: "Every response includes a pre-written, natural-language voice prompt optimized for text-to-speech delivery.",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    desc: "All data is encrypted in transit and at rest. No PII stored beyond session. Designed for law enforcement-adjacent use cases.",
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
    title: "BondCurrent Screens",
    desc: "Your voice agent POSTs to our API. We query the live parish roster, calculate the 10% premium, and assess qualification.",
  },
  {
    num: "03",
    title: "Decision Delivered",
    desc: "A structured JSON response with a qualification decision, bond details, and a ready-to-speak voice prompt is returned in milliseconds.",
  },
  {
    num: "04",
    title: "Agent Takes Over",
    desc: "Qualified callers are transferred to a live agent. Unqualified callers receive a clear, professional explanation.",
  },
];

const PARISHES = [
  { name: "St. John the Baptist", bond: true, status: "live" },
  { name: "St. Mary",             bond: true, status: "live" },
  { name: "Allen",                bond: true, status: "live" },
  { name: "Evangeline",           bond: true, status: "live" },
  { name: "Jefferson",            bond: true, status: "live" },
  { name: "Plaquemines",          bond: false, status: "live" },
  { name: "St. Bernard",          bond: false, status: "live" },
  { name: "Orleans",              bond: false, status: "live" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$149",
    period: "/mo",
    desc: "For independent bondsmen handling up to 500 calls per month.",
    features: ["500 screener calls/mo", "3 parishes", "JSON API access", "Email support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$399",
    period: "/mo",
    desc: "For growing agencies that need full parish coverage and priority support.",
    features: [
      "5,000 screener calls/mo",
      "All 8 parishes",
      "Voice prompt generation",
      "Webhook notifications",
      "Priority support",
      "API usage dashboard",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For multi-agency operations with custom integrations and SLA requirements.",
    features: [
      "Unlimited calls",
      "Custom parish coverage",
      "Dedicated infrastructure",
      "SLA guarantee",
      "Custom integrations",
      "Account manager",
    ],
    cta: "Contact Sales",
    highlight: false,
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
        background: "rgba(10, 13, 20, 0.96)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Desktop / mobile top bar ── */}
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
              background: "hsl(var(--card))",
              border: "1px solid rgba(245,158,11,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={16} color="var(--bc-amber)" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1.125rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "hsl(var(--foreground))",
            }}
          >
            Bond<span style={{ color: "var(--bc-amber)" }}>Current</span>
          </span>
        </div>

        {/* Desktop nav links */}
        <nav
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          className="hidden md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "hsl(var(--muted-foreground))",
                textDecoration: "none",
                borderRadius: 4,
                transition: "color 0.15s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "hsl(var(--foreground))"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "hsl(var(--muted-foreground))"; }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {user ? (
            <button onClick={onDashboard} className="bc-btn-primary" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.125rem" }}>
              Dashboard <ChevronRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={onLogin}
                className="hidden md:block"
                style={{
                  fontSize: "0.8125rem",
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
              <button onClick={onLogin} className="bc-btn-primary hidden md:flex" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.125rem" }}>
                Get Access <ArrowRight size={13} />
              </button>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden"
            aria-label="Toggle menu"
            style={{
              width: 38,
              height: 38,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: mobileOpen ? "var(--bc-amber-dim)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: mobileOpen ? "var(--bc-amber)" : "hsl(var(--foreground))",
              transition: "all 0.15s",
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(10, 13, 20, 0.98)",
            padding: "1rem 1.5rem 1.5rem",
          }}
        >
          {/* Nav links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.125rem", marginBottom: "1.25rem" }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={closeMobile}
                style={{
                  display: "block",
                  padding: "0.75rem 0.875rem",
                  fontSize: "1rem",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                  textDecoration: "none",
                  borderRadius: 4,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  transition: "background 0.1s, color 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bc-amber-dim)";
                  (e.currentTarget as HTMLElement).style.color = "var(--bc-amber)";
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

          {/* Mobile CTA buttons */}
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
                  Get Access <ArrowRight size={15} />
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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        paddingTop: "64px",
        overflow: "hidden",
        background: "hsl(var(--background))",
      }}
    >
      {/* Background layers */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(59,130,246,0.04) 0%, transparent 50%)
          `,
          pointerEvents: "none",
        }}
      />
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      {/* Horizontal rule at top */}
      <div
        style={{
          position: "absolute",
          top: "64px",
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)",
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 1, padding: "5rem 1.5rem" }}>
        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 0.875rem",
            borderRadius: 3,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            marginBottom: "2rem",
          }}
        >
          <span
            className="bc-status-dot live bc-pulse"
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--bc-amber)",
            }}
          >
            Live · Louisiana River Parishes · 8 Jurisdictions
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            maxWidth: "820px",
            marginBottom: "1.5rem",
            color: "hsl(var(--foreground))",
            lineHeight: 1.05,
          }}
        >
          Bond Screening.{" "}
          <span style={{ color: "var(--bc-amber)" }}>Automated.</span>
          <br />
          Decisions in Seconds.
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            maxWidth: "560px",
            fontSize: "1.125rem",
            lineHeight: 1.7,
            color: "hsl(var(--muted-foreground))",
            marginBottom: "2.5rem",
            fontWeight: 400,
          }}
        >
          BondCurrent connects your AI voice agent to live Louisiana parish jail rosters.
          Qualify callers, calculate premiums, and route ready clients — before a human picks up.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "3.5rem" }}>
          <button
            onClick={onLogin}
            className="bc-btn-primary"
            style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}
          >
            Request Access <ArrowRight size={16} />
          </button>
          <a
            href="#how-it-works"
            className="bc-btn-outline"
            style={{ fontSize: "1rem", padding: "0.875rem 2rem", textDecoration: "none" }}
          >
            See How It Works
          </a>
        </div>

        {/* Trust signals */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: ShieldCheck, text: "SOC 2 Compliant" },
            { icon: Clock,       text: "< 500ms Response" },
            { icon: MapPin,      text: "8 Parishes Covered" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <Icon size={13} color="var(--bc-amber)" />
              {text}
            </div>
          ))}
        </div>

        {/* Live API preview card */}
        <div
          style={{
            marginTop: "4rem",
            maxWidth: "640px",
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
        >
          {/* Terminal bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <Terminal size={12} color="var(--bc-amber)" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "hsl(var(--muted-foreground))",
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
                color: "var(--bc-green)",
              }}
            >
              200 OK · 312ms
            </span>
          </div>
          {/* Code */}
          <div
            style={{
              padding: "1.25rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              lineHeight: 1.75,
              color: "#94a3b8",
            }}
          >
            <div><span style={{ color: "#64748b" }}>{"// Request"}</span></div>
            <div><span style={{ color: "#f8fafc" }}>{"{"}</span></div>
            <div style={{ paddingLeft: "1.25rem" }}>
              <span style={{ color: "#fbbf24" }}>"inmate_name"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#86efac" }}>"Johnson, Marcus"</span><span style={{ color: "#64748b" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.25rem" }}>
              <span style={{ color: "#fbbf24" }}>"parish"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#86efac" }}>"St. John the Baptist"</span>
            </div>
            <div><span style={{ color: "#f8fafc" }}>{"}"}</span></div>
            <div style={{ marginTop: "0.75rem" }}><span style={{ color: "#64748b" }}>{"// Response"}</span></div>
            <div><span style={{ color: "#f8fafc" }}>{"{"}</span></div>
            <div style={{ paddingLeft: "1.25rem" }}>
              <span style={{ color: "#fbbf24" }}>"screener_decision"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#34d399" }}>"QUALIFIED"</span><span style={{ color: "#64748b" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.25rem" }}>
              <span style={{ color: "#fbbf24" }}>"total_bond_amount"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#93c5fd" }}>25000</span><span style={{ color: "#64748b" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.25rem" }}>
              <span style={{ color: "#fbbf24" }}>"calculated_premium"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#93c5fd" }}>2500</span><span style={{ color: "#64748b" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.25rem" }}>
              <span style={{ color: "#fbbf24" }}>"voice_prompt_suggestion"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#86efac" }}>"Good news — Marcus is eligible..."</span>
            </div>
            <div><span style={{ color: "#f8fafc" }}>{"}"}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats bar ──────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: "8",      label: "Parishes Indexed" },
    { value: "<500ms", label: "Avg Response Time" },
    { value: "24/7",   label: "Live Data Refresh" },
    { value: "99.9%",  label: "API Uptime" },
  ];

  return (
    <div
      style={{
        borderTop: "1px solid hsl(var(--border))",
        borderBottom: "1px solid hsl(var(--border))",
        background: "hsl(var(--card))",
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
              padding: "1.75rem 1.5rem",
              textAlign: "center",
              borderRight: i < stats.length - 1 ? "1px solid hsl(var(--border))" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                color: "var(--bc-amber)",
                lineHeight: 1,
                marginBottom: "0.35rem",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Features ───────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="bc-section" style={{ background: "hsl(var(--background))" }}>
      <div className="container">
        {/* Section header */}
        <div style={{ marginBottom: "3.5rem" }}>
          <div className="bc-rule-amber" />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--bc-amber)",
              marginBottom: "0.75rem",
            }}
          >
            Capabilities
          </div>
          <h2 style={{ maxWidth: 520, marginBottom: "1rem" }}>
            Built for the<br />
            <span style={{ color: "var(--bc-amber)" }}>Bail Bond Industry</span>
          </h2>
          <p style={{ maxWidth: 480, color: "hsl(var(--muted-foreground))", fontSize: "1rem", lineHeight: 1.7 }}>
            Every feature is designed around the specific workflow of Louisiana bail bond agencies integrating AI voice agents.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1px",
            background: "hsl(var(--border))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: "hsl(var(--card))",
                padding: "2rem",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--accent))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--card))";
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: "var(--bc-amber-dim)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <Icon size={18} color="var(--bc-amber)" />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                  marginBottom: "0.625rem",
                }}
              >
                {title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>
                {desc}
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
    <section
      id="how-it-works"
      className="bc-section"
      style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}
    >
      <div className="container">
        <div style={{ marginBottom: "3.5rem" }}>
          <div className="bc-rule-amber" />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--bc-amber)",
              marginBottom: "0.75rem",
            }}
          >
            Protocol
          </div>
          <h2>
            How the<br />
            <span style={{ color: "var(--bc-amber)" }}>Screener Works</span>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "2rem",
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
                    left: "calc(100% + 1rem)",
                    width: "calc(2rem - 2px)",
                    height: "1px",
                    background: "linear-gradient(90deg, rgba(245,158,11,0.4), rgba(245,158,11,0.1))",
                  }}
                  className="hidden lg:block"
                />
              )}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "3rem",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: "rgba(245,158,11,0.15)",
                  lineHeight: 1,
                  marginBottom: "1rem",
                }}
              >
                {step.num}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                  marginBottom: "0.625rem",
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left */}
          <div>
            <div className="bc-rule-amber" />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--bc-amber)",
                marginBottom: "0.75rem",
              }}
            >
              Jurisdiction
            </div>
            <h2 style={{ marginBottom: "1.25rem" }}>
              Parish<br />
              <span style={{ color: "var(--bc-amber)" }}>Coverage Map</span>
            </h2>
            <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.7, marginBottom: "2rem", fontSize: "0.9375rem" }}>
              We index jail rosters across Louisiana's River Parishes and surrounding jurisdictions.
              Bond data is available where the parish system exposes it.
            </p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, color: "var(--bc-amber)", lineHeight: 1 }}>5</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>With Bond Data</div>
              </div>
              <div style={{ width: 1, background: "hsl(var(--border))" }} />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>3</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>Custody Only</div>
              </div>
            </div>
          </div>

          {/* Right — parish list */}
          <div>
            <div
              style={{
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: "1rem",
                  padding: "0.625rem 1rem",
                  background: "hsl(var(--card))",
                  borderBottom: "1px solid hsl(var(--border))",
                }}
              >
                {["Parish", "Bond Data", "Status"].map((h) => (
                  <div
                    key={h}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {PARISHES.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "0.875rem 1rem",
                    borderBottom: i < PARISHES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: i % 2 === 0 ? "hsl(var(--background))" : "hsl(var(--card))",
                  }}
                >
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>
                    {p.name}
                  </div>
                  <div>
                    <span className={`bc-badge ${p.bond ? "bc-badge-green" : "bc-badge-slate"}`}>
                      {p.bond ? "Yes" : "No"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className="bc-status-dot live bc-pulse" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--bc-green)" }}>
                      Live
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
        background: "hsl(var(--card))",
        borderTop: "1px solid hsl(var(--border))",
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            style={{
              display: "inline-block",
              marginBottom: "1rem",
            }}
          >
            <div className="bc-rule-amber" style={{ margin: "0 auto 1rem" }} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--bc-amber)",
              marginBottom: "0.75rem",
            }}
          >
            Pricing
          </div>
          <h2 style={{ marginBottom: "1rem" }}>
            Simple,<br />
            <span style={{ color: "var(--bc-amber)" }}>Transparent Rates</span>
          </h2>
          <p style={{ maxWidth: 440, margin: "0 auto", color: "hsl(var(--muted-foreground))", fontSize: "0.9375rem" }}>
            14-day free trial on all plans. No credit card required. Cancel anytime.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                borderRadius: 8,
                border: plan.highlight
                  ? "1px solid rgba(245,158,11,0.4)"
                  : "1px solid hsl(var(--border))",
                background: plan.highlight
                  ? "linear-gradient(160deg, rgba(245,158,11,0.06) 0%, hsl(var(--card)) 60%)"
                  : "hsl(var(--background))",
                padding: "2rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {plan.highlight && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "var(--bc-amber)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                    }}
                  >
                    <span className="bc-badge bc-badge-amber">Most Popular</span>
                  </div>
                </>
              )}

              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "hsl(var(--muted-foreground))",
                  marginBottom: "1rem",
                }}
              >
                {plan.name}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.75rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2.75rem",
                    fontWeight: 900,
                    letterSpacing: "0.02em",
                    color: plan.highlight ? "var(--bc-amber)" : "hsl(var(--foreground))",
                    lineHeight: 1,
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
                    {plan.period}
                  </span>
                )}
              </div>

              <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {plan.desc}
              </p>

              <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
                {plan.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.625rem",
                      fontSize: "0.875rem",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    <CheckCircle2 size={13} color="var(--bc-green)" style={{ flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={onLogin}
                className={plan.highlight ? "bc-btn-primary" : "bc-btn-outline"}
                style={{ width: "100%", justifyContent: "center" }}
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
        background: "hsl(var(--background))",
        padding: "6rem 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div className="container" style={{ position: "relative", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 12,
            background: "var(--bc-amber-dim)",
            border: "1px solid rgba(245,158,11,0.3)",
            marginBottom: "1.75rem",
          }}
        >
          <Shield size={28} color="var(--bc-amber)" />
        </div>
        <h2 style={{ maxWidth: 560, margin: "0 auto 1.25rem" }}>
          Ready to Automate<br />
          <span style={{ color: "var(--bc-amber)" }}>Your Bond Screening?</span>
        </h2>
        <p
          style={{
            maxWidth: 440,
            margin: "0 auto 2.5rem",
            color: "hsl(var(--muted-foreground))",
            fontSize: "1rem",
            lineHeight: 1.7,
          }}
        >
          Join Louisiana bail bond agencies using BondCurrent to qualify callers faster and close more bonds.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={onLogin}
            className="bc-btn-primary"
            style={{ fontSize: "1rem", padding: "0.875rem 2.25rem" }}
          >
            Start Free Trial <ArrowRight size={16} />
          </button>
          <a
            href="mailto:hello@bondcurrent.com"
            className="bc-btn-outline"
            style={{ fontSize: "1rem", padding: "0.875rem 2.25rem", textDecoration: "none" }}
          >
            Contact Sales
          </a>
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
          14-day free trial · No credit card required · Cancel anytime
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
        padding: "2.5rem 0",
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
          <Shield size={14} color="var(--bc-amber)" />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "0.9375rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "hsl(var(--foreground))",
            }}
          >
            Bond<span style={{ color: "var(--bc-amber)" }}>Current</span>
          </span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: "1.5rem" }}>
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
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "hsl(var(--foreground))"; }}
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
      <Hero onLogin={handleLogin} />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Coverage />
      <Pricing onLogin={handleLogin} />
      <CTA onLogin={handleLogin} />
      <Footer />
    </div>
  );
}
