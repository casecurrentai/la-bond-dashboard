import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Mic,
  Search,
  Shield,
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  User,
  FileText,
  MapPin,
  RefreshCw,
  ChevronRight,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

/* ── Parish metadata ─────────────────────────────────────── */
const PARISHES = [
  { name: "St. Mary",     bond: true,  platform: "Most Wanted CMS" },
  { name: "Allen",        bond: true,  platform: "Most Wanted CMS" },
  { name: "Evangeline",   bond: true,  platform: "Most Wanted CMS" },
  { name: "Plaquemines",  bond: false, platform: "LA VINE / Appriss" },
  { name: "St. Bernard",  bond: false, platform: "LA VINE / Appriss" },
  { name: "Orleans",      bond: false, platform: "Appriss OCV API" },
  { name: "Jefferson",    bond: true,  platform: "JPSO Custom (Playwright)" },
];

/* ── Helpers ─────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function fmtUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function Home() {
  const [query, setQuery]           = useState("");
  const [submitted, setSubmitted]   = useState("");
  const [mode, setMode]             = useState<"name" | "charge">("name");
  const [listening, setListening]   = useState(false);
  const [scraping, setScraping]     = useState(false);

  /* ── tRPC ── */
  const stats    = trpc.dashboard.stats.useQuery();
  const search   = trpc.bookings.search.useQuery(
    { name: mode === "name" ? submitted : undefined,
      charge: mode === "charge" ? submitted : undefined },
    { enabled: submitted.length >= 2 }
  );
  const scrapeAll = trpc.scrape.all.useMutation({
    onSuccess: (res) => {
      const ok = res.filter((r: any) => r.status === "success").length;
      toast.success(`Refreshed ${ok} / ${res.length} sources`);
      stats.refetch();
      setScraping(false);
    },
    onError: (e) => { toast.error(e.message); setScraping(false); },
  });

  /* ── Handlers ── */
  const submit = useCallback(() => {
    const q = query.trim().toUpperCase();
    if (q.length >= 2) setSubmitted(q);
  }, [query]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); };

  const voiceSearch = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Voice search not supported in this browser"); return; }
    setListening(true);
    const r = new SR();
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript.toUpperCase();
      setQuery(t);
      setSubmitted(t);
    };
    r.onerror = r.onend = () => setListening(false);
    r.start();
  };

  const results       = search.data?.items ?? [];
  const totalBookings = stats.data?.totalBookings ?? 0;
  const totalBond     = stats.data?.totalBondValue ?? 0;
  const parishes      = stats.data?.parishBreakdown ?? [];

  return (
    <div style={{ backgroundColor: "var(--bc-bg)", minHeight: "100vh" }}>

      {/* ═══ NAV ════════════════════════════════════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(8, 13, 20, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--bc-border)",
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--bc-blue), #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={15} color="#fff" />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--bc-text)" }}>
              Bond<span style={{ color: "var(--bc-cyan)" }}>Current</span>
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--bc-green)", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--bc-text-3)" }}>
                {parishes.length} sources live
              </span>
            </div>
            <button
              onClick={() => { setScraping(true); scrapeAll.mutate(); }}
              disabled={scraping}
              className="bc-btn bc-btn-ghost"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
            >
              <RefreshCw size={12} style={{ animation: scraping ? "spin 1s linear infinite" : "none" }} />
              {scraping ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0 2.5rem", position: "relative", overflow: "hidden" }}>
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(37,99,235,0.18), transparent)",
        }} />
        <div className="container" style={{ textAlign: "center", position: "relative" }}>
          <div className="bc-badge bc-badge-cyan" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
            <Radio size={9} style={{ animation: "pulse 2s infinite" }} />
            Louisiana River Parishes · Real-Time
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", marginBottom: "0.75rem" }}>
            <span className="bc-gradient-text">BondCurrent</span>
          </h1>

          <p style={{ fontSize: "1.05rem", color: "var(--bc-text-2)", maxWidth: 520, margin: "0 auto 0.5rem" }}>
            Search inmate bond records across Louisiana parishes by name or charge.
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--bc-text-3)" }}>
            Voice-enabled · Updated every 30 minutes · 7 parishes indexed
          </p>
        </div>
      </section>

      {/* ═══ STATS ══════════════════════════════════════════ */}
      <section className="container" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          <div className="bc-stat">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <User size={13} style={{ color: "var(--bc-cyan)" }} />
              <span className="bc-stat-label">Active Bookings</span>
            </div>
            <span className="bc-stat-value">{fmt(totalBookings)}</span>
          </div>
          <div className="bc-stat">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <DollarSign size={13} style={{ color: "var(--bc-cyan)" }} />
              <span className="bc-stat-label">Total Bond Value</span>
            </div>
            <span className="bc-stat-value">{fmtUSD(totalBond)}</span>
          </div>
          <div className="bc-stat">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <Zap size={13} style={{ color: "var(--bc-cyan)" }} />
              <span className="bc-stat-label">Parishes Indexed</span>
            </div>
            <span className="bc-stat-value">{PARISHES.length}</span>
          </div>
        </div>
      </section>

      {/* ═══ SEARCH ═════════════════════════════════════════ */}
      <section className="container" style={{ marginBottom: "2.5rem" }}>
        <div className="bc-card" style={{ padding: "1.75rem" }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {(["name", "charge"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="bc-btn"
                style={{
                  background: mode === m ? "var(--bc-blue)" : "var(--bc-surface2)",
                  color: mode === m ? "#fff" : "var(--bc-text-2)",
                  border: `1px solid ${mode === m ? "var(--bc-blue)" : "var(--bc-border)"}`,
                  fontSize: "0.8rem",
                  padding: "0.4rem 0.9rem",
                }}
              >
                {m === "name" ? <User size={13} /> : <FileText size={13} />}
                {m === "name" ? "By Name" : "By Charge"}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{
                position: "absolute", left: "0.85rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--bc-text-3)",
                pointerEvents: "none",
              }} />
              <input
                className="bc-input"
                style={{ paddingLeft: "2.5rem" }}
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                onKeyDown={onKey}
                placeholder={mode === "name" ? "SMITH, JOHN  or  JOHN SMITH" : "DWI  or  THEFT  or  POSSESSION"}
              />
            </div>
            <button
              onClick={voiceSearch}
              disabled={listening}
              className={`bc-btn-icon${listening ? " active" : ""}`}
              title="Voice search"
              style={{ flexShrink: 0 }}
            >
              <Mic size={15} style={{ animation: listening ? "pulse 1s infinite" : "none" }} />
            </button>
            <button
              onClick={submit}
              className="bc-btn bc-btn-primary"
              style={{ flexShrink: 0, padding: "0.55rem 1.4rem" }}
            >
              Search
            </button>
          </div>

          {listening && (
            <div style={{
              marginTop: "0.75rem", padding: "0.6rem 0.9rem",
              background: "var(--bc-cyan-dim)", border: "1px solid var(--bc-cyan-border)",
              borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
              <Radio size={12} style={{ color: "var(--bc-cyan)", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--bc-cyan)" }}>Listening… speak a name or charge</span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ RESULTS ════════════════════════════════════════ */}
      <section className="container" style={{ marginBottom: "3rem" }}>

        {/* ── No query: feature cards ── */}
        {!submitted && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {[
              { icon: Search,   title: "Name Search",   desc: 'Enter "LAST, FIRST" or any partial name to find inmates across all parishes.' },
              { icon: FileText, title: "Charge Search",  desc: 'Search by offense — "DWI", "THEFT", "POSSESSION" — across all parishes.' },
              { icon: Mic,      title: "Voice Search",   desc: "Tap the mic and speak a name or charge for hands-free lookup." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bc-card" style={{ padding: "1.25rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: "var(--bc-cyan-dim)", border: "1px solid var(--bc-cyan-border)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem",
                }}>
                  <Icon size={16} style={{ color: "var(--bc-cyan)" }} />
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--bc-text)", marginBottom: "0.35rem" }}>
                  {title}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--bc-text-2)", lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {submitted && search.isLoading && (
          <div className="bc-card" style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "2px solid var(--bc-blue)", borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite", margin: "0 auto 0.75rem",
            }} />
            <p style={{ color: "var(--bc-text-2)", fontSize: "0.875rem" }}>Searching across all parishes…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {submitted && !search.isLoading && results.length === 0 && (
          <div className="bc-card" style={{ padding: "3rem", textAlign: "center" }}>
            <AlertTriangle size={32} style={{ color: "var(--bc-amber)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontWeight: 600, color: "var(--bc-text)", marginBottom: "0.35rem" }}>No records found</p>
            <p style={{ fontSize: "0.85rem", color: "var(--bc-text-2)" }}>
              No inmates matching &ldquo;{submitted}&rdquo; in the current roster. Try refreshing data or check the spelling.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {results.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--bc-text)" }}>
                {results.length} record{results.length !== 1 ? "s" : ""} for &ldquo;{submitted}&rdquo;
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {results.map((inmate: any, idx: number) => {
                const bond = inmate.bondAmount ? parseFloat(inmate.bondAmount) : null;
                return (
                  <div
                    key={idx}
                    className="bc-card bc-fade-up"
                    style={{
                      padding: "1.1rem 1.25rem",
                      borderLeft: `3px solid ${bond ? "var(--bc-cyan)" : "var(--bc-amber)"}`,
                      animationDelay: `${idx * 40}ms`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                      {/* Left: name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                          <span style={{
                            fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: "0.95rem",
                            color: "var(--bc-text)", letterSpacing: "0.03em",
                          }}>
                            {inmate.name}
                          </span>
                          <span className={`bc-badge ${bond ? "bc-badge-cyan" : "bc-badge-amber"}`}>
                            {bond ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}
                            {bond ? "Bond Set" : "No Bond"}
                          </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.78rem", color: "var(--bc-text-3)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <MapPin size={11} />
                            {inmate.parish} Parish
                          </span>
                          {inmate.bookingTime && (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Clock size={11} />
                              {new Date(inmate.bookingTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          {inmate.externalBookingId && (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
                              <Hash size={10} />
                              {inmate.externalBookingId}
                            </span>
                          )}
                        </div>

                        {inmate.chargesText && (
                          <p style={{ marginTop: "0.45rem", fontSize: "0.78rem", color: "var(--bc-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40ch" }}>
                            <span style={{ color: "var(--bc-text-3)" }}>Charges: </span>
                            {inmate.chargesText}
                          </p>
                        )}
                      </div>

                      {/* Right: bond amount */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {bond ? (
                          <>
                            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, color: "var(--bc-cyan)", letterSpacing: "-0.02em" }}>
                              ${bond.toLocaleString()}
                            </p>
                            <p style={{ fontSize: "0.7rem", color: "var(--bc-text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bond</p>
                          </>
                        ) : (
                          <p style={{ fontSize: "0.8rem", color: "var(--bc-amber)" }}>N/A</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ═══ PARISH STATUS ══════════════════════════════════ */}
      <section className="container" style={{ marginBottom: "4rem" }}>
        <p className="bc-section-title">Parish Source Index</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
          {PARISHES.map((p) => (
            <div
              key={p.name}
              className="bc-card"
              style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--bc-text)", marginBottom: "0.15rem" }}>
                  {p.name} Parish
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--bc-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.platform}
                </p>
              </div>
              <span className={`bc-badge ${p.bond ? "bc-badge-cyan" : "bc-badge-amber"}`} style={{ flexShrink: 0 }}>
                {p.bond ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}
                {p.bond ? "Bond" : "No Bond"}
              </span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "0.6rem", fontSize: "0.72rem", color: "var(--bc-text-3)", lineHeight: 1.5 }}>
          Plaquemines, St. Bernard, and Orleans use the LA VINE / Appriss platform which does not expose bond amounts on public rosters.
          Jefferson Parish bond data is confirmed but requires Playwright in production.
        </p>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid var(--bc-border)", padding: "1.5rem 0" }}>
        <div className="container" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--bc-text-3)" }}>
            BondCurrent &copy; 2026 &mdash; AI-Powered Bond Intelligence
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--bc-text-3)" }}>
            Data sourced from official Louisiana parish sheriff rosters &amp; LA VINE
          </p>
        </div>
      </footer>

    </div>
  );
}
