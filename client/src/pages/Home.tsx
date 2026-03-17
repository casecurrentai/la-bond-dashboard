import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Mic,
  Phone,
  PhoneCall,
  Radio,
  Search,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";

// ── Helpers ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Voice Agent Screener",
    desc: "Plug BondCurrent into Vapi, Retell, or Bland. Your AI agent looks up the inmate, calculates the premium, and qualifies the caller — all before a human picks up.",
    badge: "Core Feature",
    badgeColor: "bc-badge-indigo",
  },
  {
    icon: Search,
    title: "Real-Time Inmate Lookup",
    desc: "Live data from 7 Louisiana parishes including St. John the Baptist via the Zuercher Portal. No stale PDFs — every lookup hits the source.",
    badge: "7 Parishes",
    badgeColor: "bc-badge-cyan",
  },
  {
    icon: DollarSign,
    title: "Instant Bond Calculation",
    desc: "Bond amounts, 10% premium, payment plan eligibility — computed in milliseconds and returned as TTS-ready sentences your voice agent can speak directly.",
    badge: "TTS-Ready",
    badgeColor: "bc-badge-green",
  },
  {
    icon: FileText,
    title: "Call Logs & Audit Trail",
    desc: "Every screener call is logged with inmate name, bond amount, decision, and response time. Full history for compliance and performance review.",
    badge: "Compliance",
    badgeColor: "bc-badge-amber",
  },
  {
    icon: Zap,
    title: "Sub-Second Response",
    desc: "Cached roster data means most lookups return in under 200ms. Even live scrapes complete in under 3 seconds — fast enough for real-time call flow.",
    badge: "< 200ms",
    badgeColor: "bc-badge-indigo",
  },
  {
    icon: Shield,
    title: "API Key Auth",
    desc: "Each agency gets a unique API key. Rotate keys, track usage per billing period, and set per-agency premium rates and minimum thresholds.",
    badge: "Secure",
    badgeColor: "bc-badge-cyan",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Caller dials your bondsman line",
    desc: "Your Vapi or Retell voice agent answers the call and greets the caller.",
  },
  {
    step: "02",
    title: "Agent collects inmate details",
    desc: "The voice agent asks for the inmate name and parish, then calls the BondCurrent screener API.",
  },
  {
    step: "03",
    title: "BondCurrent looks up the inmate",
    desc: "We hit the live parish roster, find the inmate, pull the bond amount and charges.",
  },
  {
    step: "04",
    title: "Decision returned in real-time",
    desc: "QUALIFIED, PAYMENT_PLAN_ELIGIBLE, or UNQUALIFIED — with a TTS-ready voice prompt your agent speaks immediately.",
  },
  {
    step: "05",
    title: "Qualified callers get transferred",
    desc: "Your agent transfers the call to a licensed bondsman. Unqualified callers hear a polite close. Everything is logged.",
  },
];

const PARISHES = [
  { name: "St. John the Baptist", bond: true,  note: "206 live records · Zuercher Portal" },
  { name: "St. Mary",             bond: true,  note: "Bond amounts · Most Wanted CMS" },
  { name: "Allen",                bond: true,  note: "Bond amounts · Most Wanted CMS" },
  { name: "Evangeline",           bond: true,  note: "Bond amounts · Most Wanted CMS" },
  { name: "Jefferson",            bond: true,  note: "Bond amounts · Zuercher Portal" },
  { name: "Plaquemines",          bond: false, note: "Custody status · LA VINE" },
  { name: "St. Bernard",          bond: false, note: "Custody status · LA VINE" },
  { name: "Orleans",              bond: false, note: "Custody status · Appriss OCV" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$149",
    period: "/mo",
    desc: "Perfect for solo bondsmen getting started with voice screening.",
    features: [
      "500 screener API calls/mo",
      "3 parishes covered",
      "Call log dashboard",
      "Email support",
      "1 API key",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$349",
    period: "/mo",
    desc: "For active agencies handling 20+ calls per day.",
    features: [
      "5,000 screener API calls/mo",
      "All 7 parishes",
      "Real-time call logs",
      "Payment plan qualification",
      "Priority support",
      "3 API keys",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$799",
    period: "/mo",
    desc: "Multi-agent operations with custom configuration.",
    features: [
      "Unlimited API calls",
      "All 7 parishes",
      "Custom premium rates",
      "Webhook integrations",
      "Dedicated onboarding",
      "Unlimited API keys",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

// ── Nav ────────────────────────────────────────────────────────────────────────

function Nav() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid hsl(var(--border))",
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            }}
          >
            <Shield size={16} color="#fff" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "hsl(var(--foreground))",
              letterSpacing: "-0.02em",
            }}
          >
            Bond<span style={{ color: "var(--bc-indigo)" }}>Current</span>
          </span>
        </div>

        {/* Nav links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "hsl(var(--muted-foreground))",
          }}
          className="hidden md:flex"
        >
          <a href="#features" style={{ textDecoration: "none", color: "inherit" }}>
            Features
          </a>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit" }}>
            How It Works
          </a>
          <a href="#parishes" style={{ textDecoration: "none", color: "inherit" }}>
            Coverage
          </a>
          <a href="#pricing" style={{ textDecoration: "none", color: "inherit" }}>
            Pricing
          </a>
        </nav>

        {/* Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user ? (
            <>
              <button
                onClick={() => setLocation("/dashboard")}
                className="bc-btn-primary"
                style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
              >
                Dashboard
                <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <a
                href={getLoginUrl()}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "hsl(var(--foreground))",
                  textDecoration: "none",
                }}
              >
                Sign in
              </a>
              <a
                href={getLoginUrl()}
                className="bc-btn-primary"
                style={{
                  fontSize: "0.875rem",
                  padding: "0.5rem 1rem",
                  textDecoration: "none",
                }}
              >
                Get Started Free
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function Hero() {
  const { user } = useAuth();

  return (
    <section
      style={{
        padding: "6rem 0 5rem",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      {/* Indigo glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="container"
        style={{ textAlign: "center", position: "relative" }}
      >
        {/* Eyebrow badge */}
        <div
          className="bc-badge bc-badge-indigo"
          style={{ marginBottom: "1.5rem", display: "inline-flex" }}
        >
          <Radio size={10} className="bc-pulse" />
          Louisiana River Parishes · Live Data
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            marginBottom: "1.25rem",
            maxWidth: 780,
            margin: "0 auto 1.25rem",
          }}
        >
          Screen bail bond calls{" "}
          <span className="bc-gradient-text">in real-time</span>
          <br />
          with AI + live inmate data
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: "1.125rem",
            color: "hsl(var(--muted-foreground))",
            maxWidth: 560,
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}
        >
          BondCurrent connects your voice agent to live Louisiana parish rosters.
          Qualify callers, calculate premiums, and transfer ready clients — all
          before a human picks up.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href={user ? "/dashboard" : getLoginUrl()}
            className="bc-btn-primary"
            style={{
              fontSize: "1rem",
              padding: "0.75rem 1.75rem",
              textDecoration: "none",
            }}
          >
            Start Free Trial
            <ArrowRight size={16} />
          </a>
          <a
            href="#how-it-works"
            className="bc-btn-outline"
            style={{
              fontSize: "1rem",
              padding: "0.75rem 1.75rem",
              textDecoration: "none",
            }}
          >
            See How It Works
          </a>
        </div>

        {/* Trust line */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.8125rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          No credit card required · 14-day free trial · Cancel anytime
        </p>

        {/* Hero visual — API response preview */}
        <div
          style={{
            marginTop: "4rem",
            maxWidth: 680,
            margin: "4rem auto 0",
            borderRadius: 16,
            border: "1px solid hsl(var(--border))",
            overflow: "hidden",
            boxShadow:
              "0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(99,102,241,0.08)",
            background: "hsl(var(--card))",
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.25rem",
              borderBottom: "1px solid hsl(var(--border))",
              background: "hsl(var(--secondary))",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.75rem",
                color: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-mono)",
              }}
            >
              POST /api/v1/voice-screener
            </span>
          </div>
          {/* Code block */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              lineHeight: 1.75,
              textAlign: "left",
              background: "#0f1117",
              color: "#e2e8f0",
            }}
          >
            <div style={{ color: "#94a3b8" }}>{"// Response (187ms)"}</div>
            <div>{"{"}</div>
            <div style={{ paddingLeft: "1.5rem" }}>
              <span style={{ color: "#818cf8" }}>"success"</span>
              <span style={{ color: "#94a3b8" }}>: </span>
              <span style={{ color: "#34d399" }}>true</span>
              <span style={{ color: "#94a3b8" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.5rem" }}>
              <span style={{ color: "#818cf8" }}>"decision"</span>
              <span style={{ color: "#94a3b8" }}>: </span>
              <span style={{ color: "#fbbf24" }}>"QUALIFIED"</span>
              <span style={{ color: "#94a3b8" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.5rem" }}>
              <span style={{ color: "#818cf8" }}>"bond_amount"</span>
              <span style={{ color: "#94a3b8" }}>: </span>
              <span style={{ color: "#34d399" }}>25000</span>
              <span style={{ color: "#94a3b8" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.5rem" }}>
              <span style={{ color: "#818cf8" }}>"calculated_premium"</span>
              <span style={{ color: "#94a3b8" }}>: </span>
              <span style={{ color: "#34d399" }}>2500</span>
              <span style={{ color: "#94a3b8" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1.5rem" }}>
              <span style={{ color: "#818cf8" }}>"voice_prompt"</span>
              <span style={{ color: "#94a3b8" }}>: </span>
              <span style={{ color: "#fb7185" }}>
                "Great news! The bond is $25,000 — the 10% premium is $2,500.
                Since you have that available, I can transfer you to a licensed
                bondsman right now. Would you like that?"
              </span>
            </div>
            <div>{"}"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="bc-section" style={{ background: "#fff" }}>
      <div className="container">
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            className="bc-badge bc-badge-indigo"
            style={{ marginBottom: "1rem", display: "inline-flex" }}
          >
            <Sparkles size={10} />
            Platform Features
          </div>
          <h2 style={{ marginBottom: "0.75rem" }}>
            Everything your agency needs
          </h2>
          <p
            style={{
              color: "hsl(var(--muted-foreground))",
              maxWidth: 480,
              margin: "0 auto",
              fontSize: "1rem",
            }}
          >
            Built specifically for Louisiana bail bondsmen who want to stop
            wasting time on unqualified callers.
          </p>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bc-card-elevated"
              style={{ transition: "box-shadow 0.15s ease, transform 0.15s ease" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 4px 20px rgba(99,102,241,0.12), 0 1px 3px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)";
                (e.currentTarget as HTMLDivElement).style.transform = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "var(--bc-indigo-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <f.icon size={20} color="var(--bc-indigo)" />
                </div>
                <span className={`bc-badge ${f.badgeColor}`}>{f.badge}</span>
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                  color: "hsl(var(--foreground))",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "hsl(var(--muted-foreground))",
                  lineHeight: 1.65,
                }}
              >
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
    <section
      id="how-it-works"
      className="bc-section"
      style={{ background: "#f8f9ff" }}
    >
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            className="bc-badge bc-badge-cyan"
            style={{ marginBottom: "1rem", display: "inline-flex" }}
          >
            <Phone size={10} />
            Call Flow
          </div>
          <h2 style={{ marginBottom: "0.75rem" }}>How a screener call works</h2>
          <p
            style={{
              color: "hsl(var(--muted-foreground))",
              maxWidth: 480,
              margin: "0 auto",
              fontSize: "1rem",
            }}
          >
            From first ring to qualified transfer in under 90 seconds.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1.25rem",
            position: "relative",
          }}
        >
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={step.step}
              className="bc-card"
              style={{ position: "relative" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--bc-indigo)",
                  letterSpacing: "0.08em",
                  marginBottom: "0.75rem",
                  background: "var(--bc-indigo-dim)",
                  display: "inline-block",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 4,
                }}
              >
                STEP {step.step}
              </div>
              <h3
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                  color: "hsl(var(--foreground))",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "hsl(var(--muted-foreground))",
                  lineHeight: 1.65,
                }}
              >
                {step.desc}
              </p>
              {i < HOW_IT_WORKS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: -18,
                    transform: "translateY(-50%)",
                    color: "hsl(var(--muted-foreground))",
                    display: "none",
                  }}
                  className="hidden lg:block"
                >
                  <ChevronRight size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Parish Coverage ────────────────────────────────────────────────────────────

function ParishCoverage() {
  return (
    <section id="parishes" className="bc-section" style={{ background: "#fff" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
          }}
        >
          {/* Left: copy */}
          <div>
            <div
              className="bc-badge bc-badge-green"
              style={{ marginBottom: "1rem", display: "inline-flex" }}
            >
              <MapPin size={10} />
              Coverage Map
            </div>
            <h2 style={{ marginBottom: "1rem" }}>
              River Parishes first,
              <br />
              expanding statewide
            </h2>
            <p
              style={{
                color: "hsl(var(--muted-foreground))",
                fontSize: "1rem",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              We built BondCurrent specifically for the Louisiana River Parishes
              market. St. John the Baptist is our flagship integration — 206
              live records via the Zuercher Portal REST API, updated every 30
              minutes.
            </p>
            <p
              style={{
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.875rem",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "hsl(var(--foreground))" }}>
                Honest about data availability:
              </strong>{" "}
              5 parishes return bond amounts. 3 parishes (Plaquemines, St.
              Bernard, Orleans) provide custody status only — their systems
              don't expose bond data publicly. We never claim bond data we
              don't have.
            </p>
          </div>

          {/* Right: parish list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {PARISHES.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.875rem 1rem",
                  borderRadius: 10,
                  border: "1px solid hsl(var(--border))",
                  background: p.bond ? "hsl(var(--card))" : "hsl(var(--secondary))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: p.bond ? "var(--bc-green)" : "hsl(var(--muted-foreground))",
                      flexShrink: 0,
                    }}
                    className={p.bond ? "bc-pulse" : ""}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      {p.note}
                    </div>
                  </div>
                </div>
                <span
                  className={`bc-badge ${p.bond ? "bc-badge-green" : "bc-badge-amber"}`}
                >
                  {p.bond ? "Bond Data" : "Custody Only"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="bc-section" style={{ background: "#f8f9ff" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            className="bc-badge bc-badge-indigo"
            style={{ marginBottom: "1rem", display: "inline-flex" }}
          >
            <DollarSign size={10} />
            Pricing
          </div>
          <h2 style={{ marginBottom: "0.75rem" }}>Simple, transparent pricing</h2>
          <p
            style={{
              color: "hsl(var(--muted-foreground))",
              maxWidth: 440,
              margin: "0 auto",
              fontSize: "1rem",
            }}
          >
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
            maxWidth: 960,
            margin: "0 auto",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                borderRadius: 16,
                border: plan.highlight
                  ? "2px solid var(--bc-indigo)"
                  : "1px solid hsl(var(--border))",
                background: plan.highlight ? "#fff" : "hsl(var(--card))",
                padding: "1.75rem",
                position: "relative",
                boxShadow: plan.highlight
                  ? "0 8px 30px rgba(99,102,241,0.15)"
                  : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <span className="bc-badge bc-badge-indigo">Most Popular</span>
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "hsl(var(--muted-foreground))",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "0.5rem",
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.25rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "2.5rem",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "hsl(var(--muted-foreground))",
                    lineHeight: 1.55,
                  }}
                >
                  {plan.desc}
                </p>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    <CheckCircle2
                      size={15}
                      style={{ color: "var(--bc-green)", flexShrink: 0 }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={getLoginUrl()}
                className={plan.highlight ? "bc-btn-primary" : "bc-btn-outline"}
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "0.625rem 1rem",
                  width: "100%",
                  fontSize: "0.9375rem",
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ─────────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section
      style={{
        padding: "5rem 0",
        background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "-5%",
          width: "35vw",
          height: "35vw",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 999,
            padding: "0.3rem 0.8rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#fff",
            marginBottom: "1.5rem",
          }}
        >
          <Mic size={10} />
          Ready for Vapi · Retell · Bland
        </div>

        <h2
          style={{
            color: "#fff",
            marginBottom: "1rem",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          }}
        >
          Stop losing qualified callers
          <br />
          to slow manual lookups
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "1.0625rem",
            maxWidth: 480,
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}
        >
          Set up BondCurrent in under 30 minutes. Connect your voice agent,
          add your API key, and start screening calls today.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href={getLoginUrl()}
            style={{
              background: "#fff",
              color: "var(--bc-indigo)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1.75rem",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "none";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
            }}
          >
            Start Free Trial
            <ArrowRight size={16} />
          </a>
          <a
            href="mailto:hello@bondcurrent.com"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1.75rem",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Talk to Sales
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      style={{
        padding: "2.5rem 0",
        borderTop: "1px solid hsl(var(--border))",
        background: "#fff",
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
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={13} color="#fff" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: "0.9375rem",
              color: "hsl(var(--foreground))",
            }}
          >
            Bond<span style={{ color: "var(--bc-indigo)" }}>Current</span>
          </span>
        </div>

        {/* Links */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            fontSize: "0.8125rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <a href="#features" style={{ textDecoration: "none", color: "inherit" }}>
            Features
          </a>
          <a href="#pricing" style={{ textDecoration: "none", color: "inherit" }}>
            Pricing
          </a>
          <a href="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            Dashboard
          </a>
          <a
            href="mailto:hello@bondcurrent.com"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Contact
          </a>
        </div>

        {/* Copyright */}
        <p
          style={{
            fontSize: "0.75rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          © 2026 BondCurrent. Built for Louisiana bail bondsmen.
        </p>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <ParishCoverage />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  );
}
