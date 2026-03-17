/**
 * BondCurrent Dashboard
 * Authenticated view for bail bond agencies.
 * Shows: call log, live screener lookup, parish status, API key info.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  FileText,
  Hash,
  Key,
  Loader2,
  LogOut,
  MapPin,
  Mic,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScreenerResult {
  success: boolean;
  found?: boolean;
  screener_decision?: string;
  decision?: string;
  inmate_name_confirmed?: string;
  booking_number?: string;
  parish?: string;
  total_bond_amount?: number | null;
  bond_text?: string;
  charges?: string[];
  booking_date?: string;
  age?: number;
  calculated_premium?: number | null;
  voice_prompt_suggestion?: string;
  voice_prompt?: string;
  data_freshness?: string;
  response_time_ms?: number;
  error?: string;
  message?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DECISION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  QUALIFIED: {
    label: "Qualified",
    color: "var(--bc-green)",
    bg: "var(--bc-green-dim)",
    icon: CheckCircle2,
  },
  PAYMENT_PLAN_ELIGIBLE: {
    label: "Payment Plan",
    color: "var(--bc-cyan)",
    bg: "var(--bc-cyan-dim)",
    icon: DollarSign,
  },
  NEEDS_MANUAL_REVIEW: {
    label: "Manual Review",
    color: "var(--bc-amber)",
    bg: "var(--bc-amber-dim)",
    icon: AlertCircle,
  },
  UNQUALIFIED: {
    label: "Unqualified",
    color: "var(--bc-red)",
    bg: "rgba(239,68,68,0.1)",
    icon: XCircle,
  },
  NOT_FOUND: {
    label: "Not Found",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--secondary))",
    icon: Search,
  },
};

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(ts: string | Date | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(ts: string | Date | null | undefined): string {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Shield;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="bc-card-elevated"
      style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: accent ? `${accent}20` : "var(--bc-indigo-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={15} color={accent || "var(--bc-indigo)"} />
        </div>
      </div>
      <span className="bc-stat-number">{value}</span>
      {sub && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Live Screener Panel ────────────────────────────────────────────────────────

function ScreenerPanel() {
  const [inmateName, setInmateName] = useState("");
  const [parish, setParish] = useState("St. John the Baptist");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [listening, setListening] = useState(false);

  const PARISHES = [
    "St. John the Baptist",
    "St. Mary",
    "Allen",
    "Evangeline",
    "Jefferson",
    "Plaquemines",
    "St. Bernard",
    "Orleans",
  ];

  const runLookup = useCallback(async () => {
    if (!inmateName.trim()) {
      toast.error("Enter an inmate name");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/voice-screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inmate_name: inmateName.trim(),
          parish,
          caller_budget_available: budget ? parseFloat(budget) : undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast.error("Lookup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [inmateName, parish, budget]);

  const voiceInput = () => {
    const SR =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    setListening(true);
    const r = new SR();
    r.onresult = (e: any) => {
      setInmateName(e.results[0][0].transcript);
    };
    r.onerror = r.onend = () => setListening(false);
    r.start();
  };

  const decisionKey = result?.screener_decision || result?.decision;
  const decision = decisionKey
    ? DECISION_CONFIG[decisionKey] || DECISION_CONFIG.NOT_FOUND
    : null;

  return (
    <div className="bc-card-elevated">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--bc-indigo-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PhoneCall size={15} color="var(--bc-indigo)" />
        </div>
        <div>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "hsl(var(--foreground))",
            }}
          >
            Live Screener Lookup
          </h3>
          <p
            style={{
              fontSize: "0.75rem",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Test the voice screener API in real-time
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        {/* Inmate name */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "hsl(var(--foreground))",
              marginBottom: "0.35rem",
            }}
          >
            Inmate Name
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={inmateName}
              onChange={(e) => setInmateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runLookup()}
              placeholder="e.g. John Smith or Smith, John"
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                fontSize: "0.875rem",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                outline: "none",
              }}
            />
            <button
              onClick={voiceInput}
              disabled={listening}
              title="Voice input"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: listening ? "var(--bc-indigo-dim)" : "hsl(var(--background))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Mic
                size={15}
                color={listening ? "var(--bc-indigo)" : "hsl(var(--muted-foreground))"}
              />
            </button>
          </div>
        </div>

        {/* Parish */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "hsl(var(--foreground))",
              marginBottom: "0.35rem",
            }}
          >
            Parish
          </label>
          <select
            value={parish}
            onChange={(e) => setParish(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              fontSize: "0.875rem",
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              outline: "none",
            }}
          >
            {PARISHES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "hsl(var(--foreground))",
              marginBottom: "0.35rem",
            }}
          >
            Caller Budget (optional)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 2500"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              fontSize: "0.875rem",
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              outline: "none",
            }}
          />
        </div>
      </div>

      <button
        onClick={runLookup}
        disabled={loading}
        className="bc-btn-primary"
        style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
      >
        {loading ? (
          <>
            <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
            Looking up…
          </>
        ) : (
          <>
            <Search size={15} />
            Run Screener Lookup
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${decision ? decision.color + "40" : "hsl(var(--border))"}`,
            background: decision ? decision.bg : "hsl(var(--secondary))",
            padding: "1rem",
          }}
        >
          {result.success && result.found ? (
            <>
              {/* Decision badge */}
              {decision && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <decision.icon size={16} color={decision.color} />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: decision.color,
                    }}
                  >
                    {decision.label}
                  </span>
                  {result.response_time_ms && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.75rem",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      {result.response_time_ms}ms
                    </span>
                  )}
                </div>
              )}

              {/* Inmate details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--muted-foreground))",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Name
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {result.inmate_name_confirmed || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--muted-foreground))",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Booking #
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {result.booking_number || '—'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--muted-foreground))",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Bond Amount
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--bc-green)",
                    }}
                  >
                    {fmtUSD(result.total_bond_amount)}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--muted-foreground))",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    10% Premium
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--bc-indigo)",
                    }}
                  >
                    {fmtUSD(result.calculated_premium)}
                  </div>
                </div>
              </div>

              {/* Charges */}
              {result.charges && result.charges.length > 0 && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--muted-foreground))",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Charges
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.35rem",
                    }}
                  >
                    {result.charges!.slice(0, 5).map((c: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: 4,
                          background: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice prompt */}
              {(result.voice_prompt_suggestion || result.voice_prompt) && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: 8,
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <Mic size={12} color="var(--bc-indigo)" />
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "var(--bc-indigo)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      TTS Voice Prompt
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "hsl(var(--foreground))",
                      lineHeight: 1.6,
                      fontStyle: "italic",
                    }}
                  >
                    "{result.voice_prompt_suggestion || result.voice_prompt}"
                  </p>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.875rem",
              }}
            >
              <Search size={15} />
              {result.error || "Inmate not found in current roster."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Call Log Table ─────────────────────────────────────────────────────────────

function CallLogTable() {
  const logs = trpc.logs.recent.useQuery({ limit: 50 });
  const stats = trpc.dashboard.stats.useQuery();

  const rows = logs.data ?? [];

  return (
    <div className="bc-card-elevated">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--bc-indigo-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={15} color="var(--bc-indigo)" />
          </div>
          <div>
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "hsl(var(--foreground))",
              }}
            >
              Scrape Activity Log
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              Recent parish data collection runs
            </p>
          </div>
        </div>
        <button
          onClick={() => logs.refetch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.75rem",
            color: "hsl(var(--muted-foreground))",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.35rem 0.6rem",
            borderRadius: 6,
          }}
        >
          <RefreshCw
            size={12}
            style={{
              animation: logs.isFetching ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {logs.isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            color: "hsl(var(--muted-foreground))",
            gap: "0.5rem",
          }}
        >
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          Loading logs…
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <Activity
            size={32}
            style={{ marginBottom: "0.75rem", opacity: 0.4 }}
          />
          <p style={{ fontSize: "0.875rem" }}>
            No scrape logs yet. Run a scrape to populate this table.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8125rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid hsl(var(--border))",
                }}
              >
                {[
                  "Parish",
                  "Status",
                  "Records",
                  "New",
                  "Duration",
                  "Time",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "hsl(var(--muted-foreground))",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, i: number) => (
                <tr
                  key={row.id || i}
                  style={{
                    borderBottom: "1px solid hsl(var(--border))",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "hsl(var(--secondary))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "transparent";
                  }}
                >
                  <td
                    style={{
                      padding: "0.625rem 0.75rem",
                      fontWeight: 600,
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {row.parish}
                  </td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background:
                          row.status === "success"
                            ? "var(--bc-green-dim)"
                            : "rgba(239,68,68,0.1)",
                        color:
                          row.status === "success"
                            ? "var(--bc-green)"
                            : "var(--bc-red)",
                      }}
                    >
                      {row.status === "success" ? (
                        <CheckCircle2 size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {row.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.625rem 0.75rem",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {row.recordCount?.toLocaleString() ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "0.625rem 0.75rem",
                      color:
                        (row.newBookings ?? 0) > 0
                          ? "var(--bc-indigo)"
                          : "hsl(var(--muted-foreground))",
                      fontWeight: (row.newBookings ?? 0) > 0 ? 600 : 400,
                    }}
                  >
                    {row.newBookings ?? 0}
                  </td>
                  <td
                    style={{
                      padding: "0.625rem 0.75rem",
                      color: "hsl(var(--muted-foreground))",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td
                    style={{
                      padding: "0.625rem 0.75rem",
                      color: "hsl(var(--muted-foreground))",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {timeAgo(row.scrapedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Parish Status Grid ─────────────────────────────────────────────────────────

function ParishStatusGrid() {
  const sources = trpc.sources.list.useQuery();

  const PARISH_META: Record<
    string,
    { bond: boolean; platform: string; priority?: boolean }
  > = {
    "St. John the Baptist": {
      bond: true,
      platform: "Zuercher Portal",
      priority: true,
    },
    "St. Mary": { bond: true, platform: "Most Wanted CMS" },
    Allen: { bond: true, platform: "Most Wanted CMS" },
    Evangeline: { bond: true, platform: "Most Wanted CMS" },
    Jefferson: { bond: true, platform: "Zuercher Portal" },
    Plaquemines: { bond: false, platform: "LA VINE / Appriss" },
    "St. Bernard": { bond: false, platform: "LA VINE / Appriss" },
    Orleans: { bond: false, platform: "Appriss OCV" },
  };

  const rows = sources.data ?? [];

  return (
    <div className="bc-card-elevated">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--bc-green-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={15} color="var(--bc-green)" />
        </div>
        <div>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "hsl(var(--foreground))",
            }}
          >
            Parish Coverage
          </h3>
          <p
            style={{
              fontSize: "0.75rem",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Data sources and bond availability
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.625rem",
        }}
      >
        {Object.entries(PARISH_META).map(([name, meta]) => {
          const source = rows.find((s: any) => s.parish === name);
          const isActive = source?.isActive ?? false;
          const recordCount = source?.recordCount ?? 0;
          const lastPolled = source?.lastPolledAt;

          return (
            <div
              key={name}
              style={{
                padding: "0.875rem",
                borderRadius: 10,
                border: `1px solid ${meta.priority ? "rgba(99,102,241,0.3)" : "hsl(var(--border))"}`,
                background: meta.priority
                  ? "var(--bc-indigo-dim)"
                  : "hsl(var(--card))",
                position: "relative",
              }}
            >
              {meta.priority && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "var(--bc-indigo)",
                    background: "var(--bc-indigo-dim)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 3,
                    padding: "0.1rem 0.35rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Priority
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.35rem",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isActive
                      ? "var(--bc-green)"
                      : "hsl(var(--muted-foreground))",
                    flexShrink: 0,
                  }}
                  className={isActive ? "bc-pulse" : ""}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {name}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "hsl(var(--muted-foreground))",
                  marginBottom: "0.35rem",
                }}
              >
                {meta.platform}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  className={`bc-badge ${meta.bond ? "bc-badge-green" : "bc-badge-amber"}`}
                  style={{ fontSize: "0.6875rem" }}
                >
                  {meta.bond ? "Bond Data" : "Custody Only"}
                </span>
                {recordCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {recordCount.toLocaleString()} records
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── API Key Panel ──────────────────────────────────────────────────────────────

function ApiKeyPanel({ user }: { user: any }) {
  const [copied, setCopied] = useState(false);

  // Generate a deterministic demo key from user ID
  const demoKey = `bc_live_${(user?.openId || "demo").substring(0, 8)}_xxxxxxxxxxxx`.replace(
    /x/g,
    () => Math.floor(Math.random() * 16).toString(16)
  );

  const copyKey = () => {
    navigator.clipboard.writeText(demoKey).then(() => {
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bc-card-elevated">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--bc-amber-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Key size={15} color="var(--bc-amber)" />
        </div>
        <div>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "hsl(var(--foreground))",
            }}
          >
            API Integration
          </h3>
          <p
            style={{
              fontSize: "0.75rem",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Connect your voice agent to BondCurrent
          </p>
        </div>
      </div>

      {/* Endpoint */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "hsl(var(--foreground))",
            marginBottom: "0.35rem",
          }}
        >
          Screener Endpoint
        </div>
        <div
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: "#0f1117",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "#818cf8",
          }}
        >
          POST /api/v1/voice-screener
        </div>
      </div>

      {/* API key */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "hsl(var(--foreground))",
            marginBottom: "0.35rem",
          }}
        >
          Your API Key
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--secondary))",
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "hsl(var(--foreground))",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {demoKey}
          </span>
          <button
            onClick={copyKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              color: copied ? "var(--bc-green)" : "hsl(var(--muted-foreground))",
              background: "none",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Copy size={12} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Quick-start code */}
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "hsl(var(--foreground))",
            marginBottom: "0.35rem",
          }}
        >
          Quick Start (curl)
        </div>
        <div
          style={{
            padding: "0.75rem",
            borderRadius: 8,
            background: "#0f1117",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "#94a3b8",
            lineHeight: 1.7,
            overflowX: "auto",
          }}
        >
          <div>
            <span style={{ color: "#818cf8" }}>curl</span>{" "}
            <span style={{ color: "#34d399" }}>-X POST</span> \
          </div>
          <div style={{ paddingLeft: "1rem" }}>
            <span style={{ color: "#818cf8" }}>-H</span>{" "}
            <span style={{ color: "#fbbf24" }}>
              'Content-Type: application/json'
            </span>{" "}
            \
          </div>
          <div style={{ paddingLeft: "1rem" }}>
            <span style={{ color: "#818cf8" }}>-d</span>{" "}
            <span style={{ color: "#fbbf24" }}>
              '{`{"inmate_name":"John Smith","parish":"St. John the Baptist"}`}'
            </span>{" "}
            \
          </div>
          <div style={{ paddingLeft: "1rem" }}>
            <span style={{ color: "#fb7185" }}>
              /api/v1/voice-screener
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [scraping, setScraping] = useState(false);

  const stats = trpc.dashboard.stats.useQuery();
  const scrapeAll = trpc.scrape.all.useMutation({
    onSuccess: (res: any[]) => {
      const ok = res.filter((r) => r.status === "success").length;
      toast.success(`Refreshed ${ok} / ${res.length} sources`);
      stats.refetch();
      setScraping(false);
    },
    onError: (e: any) => {
      toast.error(e.message);
      setScraping(false);
    },
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "hsl(var(--background))",
        }}
      >
        <Loader2
          size={24}
          color="var(--bc-indigo)"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "hsl(var(--background))",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 400,
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "var(--bc-indigo-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <Shield size={26} color="var(--bc-indigo)" />
          </div>
          <h2 style={{ marginBottom: "0.75rem" }}>Sign in to continue</h2>
          <p
            style={{
              color: "hsl(var(--muted-foreground))",
              fontSize: "0.9375rem",
              marginBottom: "1.5rem",
            }}
          >
            Access to the BondCurrent dashboard requires authentication.
          </p>
          <a
            href={getLoginUrl()}
            className="bc-btn-primary"
            style={{
              display: "inline-flex",
              textDecoration: "none",
              padding: "0.75rem 1.75rem",
              fontSize: "1rem",
            }}
          >
            Sign In
            <ChevronRight size={16} />
          </a>
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setLocation("/")}
              style={{
                fontSize: "0.875rem",
                color: "hsl(var(--muted-foreground))",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalBookings = stats.data?.totalBookings ?? 0;
  const totalBond = stats.data?.totalBondValue ?? 0;
  const parishBreakdown = stats.data?.parishBreakdown ?? [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(var(--background))",
      }}
    >
      {/* ── Top nav ── */}
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
          {/* Logo + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setLocation("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={14} color="#fff" />
              </div>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "hsl(var(--foreground))",
                  letterSpacing: "-0.02em",
                }}
              >
                Bond<span style={{ color: "var(--bc-indigo)" }}>Current</span>
              </span>
            </button>
            <ChevronRight size={14} color="hsl(var(--muted-foreground))" />
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "hsl(var(--foreground))",
              }}
            >
              Dashboard
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => {
                setScraping(true);
                scrapeAll.mutate();
              }}
              disabled={scraping}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "hsl(var(--muted-foreground))",
                background: "none",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "0.4rem 0.85rem",
                cursor: scraping ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              <RefreshCw
                size={13}
                style={{ animation: scraping ? "spin 1s linear infinite" : "none" }}
              />
              {scraping ? "Refreshing…" : "Refresh Data"}
            </button>

            {/* User menu */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.75rem",
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "hsl(var(--foreground))",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--bc-indigo-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--bc-indigo)",
                }}
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden md:block">{user.name || user.email}</span>
              <button
                onClick={logout}
                title="Sign out"
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "hsl(var(--muted-foreground))",
                  padding: "0.15rem",
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "hsl(var(--foreground))",
              marginBottom: "0.25rem",
            }}
          >
            Welcome back, {user.name?.split(" ")[0] || "Bondsman"}
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Real-time bond intelligence for Louisiana River Parishes
          </p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <StatCard
            icon={User}
            label="Active Bookings"
            value={totalBookings.toLocaleString()}
            sub="across all parishes"
            accent="var(--bc-indigo)"
          />
          <StatCard
            icon={DollarSign}
            label="Total Bond Value"
            value={fmtUSD(totalBond)}
            sub="in current roster"
            accent="var(--bc-green)"
          />
          <StatCard
            icon={MapPin}
            label="Parishes Indexed"
            value={parishBreakdown.length || 8}
            sub="7 with bond data"
            accent="var(--bc-cyan)"
          />
          <StatCard
            icon={Zap}
            label="Screener API"
            value="Live"
            sub="POST /api/v1/voice-screener"
            accent="var(--bc-amber)"
          />
        </div>

        {/* Main grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <ScreenerPanel />
          <ApiKeyPanel user={user} />
        </div>

        {/* Full-width sections */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <ParishStatusGrid />
          <CallLogTable />
        </div>
      </main>
    </div>
  );
}
