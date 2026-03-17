/**
 * BondCurrent Dashboard — Law Enforcement Edition
 * Dark, authoritative, data-dense layout
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  DollarSign,
  Key,
  Loader2,
  LogOut,
  MapPin,
  Mic,
  Phone,
  PhoneCall,
  PhoneForwarded,
  RefreshCw,
  Search,
  Shield,
  Terminal,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface JailContact {
  facility_name: string;
  booking_phone: string;
  main_phone: string;
  address: string;
  hours: string;
  notes: string;
  call_script: string;
}

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
  inmate_name_searched?: string;
  jail_contact?: JailContact | null;
  workflow_action?: "CALL_BOOKING_DESK" | "PROCEED";
}

// ── Decision config ────────────────────────────────────────────────────────────

const DECISION_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof CheckCircle2;
}> = {
  QUALIFIED: {
    label: "QUALIFIED",
    color: "var(--bc-green)",
    bg: "var(--bc-green-dim)",
    border: "rgba(34,197,94,0.25)",
    icon: CheckCircle2,
  },
  PAYMENT_PLAN_ELIGIBLE: {
    label: "PAYMENT PLAN",
    color: "var(--bc-amber)",
    bg: "var(--bc-amber-dim)",
    border: "rgba(245,158,11,0.25)",
    icon: DollarSign,
  },
  NEEDS_MANUAL_REVIEW: {
    label: "MANUAL REVIEW",
    color: "var(--bc-amber)",
    bg: "var(--bc-amber-dim)",
    border: "rgba(245,158,11,0.25)",
    icon: AlertCircle,
  },
  UNQUALIFIED: {
    label: "UNQUALIFIED",
    color: "var(--bc-red)",
    bg: "var(--bc-red-dim)",
    border: "rgba(239,68,68,0.25)",
    icon: XCircle,
  },
  NOT_FOUND: {
    label: "NOT FOUND",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--accent))",
    border: "hsl(var(--border))",
    icon: Search,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
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

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  user,
  onLogout,
  onHome,
}: {
  user: any;
  onLogout: () => void;
  onHome: () => void;
}) {
  const navItems = [
    { icon: Activity,  label: "Overview",   active: true },
    { icon: PhoneCall, label: "Screener",    active: false },
    { icon: Phone,     label: "Call Logs",   active: false },
    { icon: MapPin,    label: "Coverage",    active: false },
    { icon: Key,       label: "API Keys",    active: false },
  ];

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: "hsl(var(--card))",
        borderRight: "1px solid hsl(var(--border))",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem",
          borderBottom: "1px solid hsl(var(--border))",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          cursor: "pointer",
        }}
        onClick={onHome}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: "var(--bc-amber-dim)",
            border: "1px solid rgba(245,158,11,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Shield size={14} color="var(--bc-amber)" />
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
          }}
        >
          Bond<span style={{ color: "var(--bc-amber)" }}>Current</span>
        </span>
      </div>

      {/* Status indicator */}
      <div
        style={{
          margin: "0.75rem 0.75rem 0",
          padding: "0.5rem 0.75rem",
          borderRadius: 4,
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span className="bc-status-dot live bc-pulse" />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--bc-green)",
          }}
        >
          All Systems Operational
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.5875rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
            padding: "0.5rem 0.5rem 0.25rem",
            marginBottom: "0.25rem",
          }}
        >
          Navigation
        </div>
        {navItems.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            onClick={() => {
              if (!active) toast.info(`${label} — coming soon`);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              width: "100%",
              padding: "0.5625rem 0.625rem",
              borderRadius: 4,
              border: "none",
              background: active ? "var(--bc-amber-dim)" : "transparent",
              color: active ? "var(--bc-amber)" : "hsl(var(--muted-foreground))",
              fontSize: "0.8125rem",
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.1s",
              marginBottom: "0.125rem",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--accent))";
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--foreground))";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))";
              }
            }}
          >
            <Icon size={14} />
            {label}
            {active && (
              <div
                style={{
                  marginLeft: "auto",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--bc-amber)",
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* User info */}
      <div
        style={{
          padding: "0.875rem 0.75rem",
          borderTop: "1px solid hsl(var(--border))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--bc-amber-dim)",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--bc-amber)",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "hsl(var(--foreground))",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name || "User"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                color: "hsl(var(--muted-foreground))",
                letterSpacing: "0.04em",
              }}
            >
              Pro Plan
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            width: "100%",
            padding: "0.4rem 0.5rem",
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.75rem",
            cursor: "pointer",
            transition: "all 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--bc-red)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bc-red-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "var(--bc-amber)",
}: {
  icon: typeof Shield;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.875rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={13} color={accent} />
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.875rem",
          fontWeight: 800,
          letterSpacing: "0.04em",
          color: "hsl(var(--foreground))",
          lineHeight: 1,
          marginBottom: "0.35rem",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.04em",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── No-Bond Fallback Workflow ─────────────────────────────────────────────────

function NoBondWorkflow({ result }: { result: ScreenerResult }) {
  const [scriptOpen, setScriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jc = result.jail_contact;
  const isNotFound = !result.found;

  const copyScript = () => {
    if (!jc) return;
    navigator.clipboard.writeText(jc.call_script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      {/* Status banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: jc ? "1rem" : 0,
        padding: "0.625rem 0.75rem",
        borderRadius: 4,
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
      }}>
        <AlertCircle size={14} color="var(--bc-amber)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground))" }}>
          {isNotFound
            ? `"${result.inmate_name_searched || "Inmate"}" was not found in the ${result.parish || ""} online roster.`
            : `Inmate found but bond amount has not been set yet.`}
          {jc && " Call the booking desk to inquire."}
        </span>
      </div>

      {jc && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Facility card */}
          <div style={{
            borderRadius: 4,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "0.625rem 0.875rem",
              borderBottom: "1px solid hsl(var(--border))",
              background: "rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <Shield size={13} color="var(--bc-amber)" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
                {jc.facility_name}
              </span>
            </div>

            {/* Contact grid */}
            <div style={{ padding: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Booking phone */}
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.2rem" }}>
                  Booking Desk
                </div>
                <a
                  href={`tel:${jc.booking_phone.replace(/[^0-9+]/g, "")}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", textDecoration: "none" }}
                >
                  <PhoneForwarded size={13} color="var(--bc-green)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 700, color: "var(--bc-green)", letterSpacing: "0.04em" }}>
                    {jc.booking_phone}
                  </span>
                </a>
              </div>

              {/* Main phone */}
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.2rem" }}>
                  Main Line
                </div>
                <a
                  href={`tel:${jc.main_phone.replace(/[^0-9+]/g, "")}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", textDecoration: "none" }}
                >
                  <Phone size={13} color="hsl(var(--muted-foreground))" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "hsl(var(--foreground))", letterSpacing: "0.04em" }}>
                    {jc.main_phone}
                  </span>
                </a>
              </div>

              {/* Address */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.2rem" }}>
                  Address
                </div>
                <span style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground))" }}>{jc.address}</span>
              </div>

              {/* Hours */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.2rem" }}>
                  Hours
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Clock size={11} color="var(--bc-amber)" />
                  <span style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground))" }}>{jc.hours}</span>
                </div>
              </div>

              {/* Notes */}
              {jc.notes && (
                <div style={{ gridColumn: "1 / -1", padding: "0.5rem 0.625rem", borderRadius: 3, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))" }}>
                    {jc.notes}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Call script */}
          <div style={{
            borderRadius: 4,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            overflow: "hidden",
          }}>
            <button
              onClick={() => setScriptOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 0.875rem",
                background: "rgba(0,0,0,0.2)",
                border: "none",
                borderBottom: scriptOpen ? "1px solid hsl(var(--border))" : "none",
                cursor: "pointer",
                color: "hsl(var(--foreground))",
                textAlign: "left",
              }}
            >
              <ClipboardList size={13} color="var(--bc-amber)" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", flex: 1 }}>
                Call Script
              </span>
              <ChevronRight
                size={13}
                color="hsl(var(--muted-foreground))"
                style={{ transform: scriptOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
              />
            </button>

            {scriptOpen && (
              <div style={{ padding: "0.875rem" }}>
                <pre style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "hsl(var(--foreground))",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  marginBottom: "0.75rem",
                }}>
                  {jc.call_script}
                </pre>
                <button
                  onClick={copyScript}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.4rem 0.875rem",
                    borderRadius: 3,
                    border: "1px solid rgba(245,158,11,0.3)",
                    background: copied ? "var(--bc-amber-dim)" : "transparent",
                    color: copied ? "var(--bc-amber)" : "hsl(var(--muted-foreground))",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Copy size={11} />
                  {copied ? "Copied!" : "Copy Script"}
                </button>
              </div>
            )}
          </div>

          {/* Call now CTA */}
          <a
            href={`tel:${jc.booking_phone.replace(/[^0-9+]/g, "")}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              borderRadius: 4,
              background: "var(--bc-amber)",
              color: "#000",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "0.875rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <PhoneCall size={15} />
            Call Booking Desk — {jc.booking_phone}
          </a>
        </div>
      )}
    </div>
  );
}

// ── Live Screener Panel ────────────────────────────────────────────────────────

// Parishes with confirmed live data
const ACTIVE_PARISHES = [
  { name: "Allen",                 status: "live" },
  { name: "St. Mary",              status: "live" },
  { name: "Evangeline",            status: "live" },
  { name: "St. John the Baptist",  status: "live" },
  { name: "Plaquemines",           status: "limited" },
  { name: "St. Bernard",           status: "limited" },
];

function ScreenerPanel() {
  const [inmateName, setInmateName] = useState("");
  const [parish, setParish] = useState("Allen");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenerResult | null>(null);
  const [listening, setListening] = useState(false);
  const [searchAll, setSearchAll] = useState(false);

  const stjohnScreenMutation = trpc.stjohn.screen.useMutation();

  // Fetch St. John inmates directly from the browser (server IP is blocked by Zuercher portal)
  const fetchZuercherClientSide = async (nameQuery: string): Promise<any[]> => {
    try {
      const lastName = nameQuery.includes(",")
        ? nameQuery.split(",")[0].trim().toUpperCase()
        : nameQuery.trim().toUpperCase().split(/\s+/).pop() ?? nameQuery.toUpperCase();
      const resp = await fetch("https://stjohn-so-la.zuercherportal.com/api/portal/inmates/load", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: lastName,
          race: "all", sex: "all", cell_block: "all", held_for_agency: "any",
          in_custody: new Date().toISOString(),
          paging: { count: 50, start: 0 },
          sorting: { sort_by_column_tag: "name", sort_descending: false },
        }),
        credentials: "include",
      });
      if (!resp.ok) return [];
      const json = await resp.json();
      return Array.isArray(json) ? json : (json.records ?? json.data ?? []);
    } catch {
      return [];
    }
  };

  const runLookup = useCallback(async () => {
    if (!inmateName.trim()) { toast.error("Enter an inmate name"); return; }
    setLoading(true);
    setResult(null);
    try {
      if (searchAll) {
        // Search all active parishes in parallel
        // St. John uses client-side fetch; others use the server API
        const otherParishes = ACTIVE_PARISHES.filter(p => p.name !== "St. John the Baptist").map(p => p.name);
        const [serverResults, stjohnRecords] = await Promise.all([
          Promise.all(
            otherParishes.map((p) =>
              fetch("/api/v1/voice-screener", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  inmate_name: inmateName.trim(),
                  parish: p,
                  caller_budget_available: budget ? parseFloat(budget) : undefined,
                }),
              }).then((r) => r.json()).catch(() => null)
            )
          ),
          fetchZuercherClientSide(inmateName.trim()),
        ]);
        let stjohnResult: any = null;
        if (stjohnRecords.length > 0) {
          stjohnResult = await stjohnScreenMutation.mutateAsync({
            inmate_name: inmateName.trim(),
            caller_budget: budget ? parseFloat(budget) : undefined,
            zuercher_records: stjohnRecords,
          }).catch(() => null);
        }
        const allResults = [...serverResults, stjohnResult].filter(Boolean);
        const found = allResults.find((r) => r && r.found);
        const notFound = allResults.find((r) => r && !r.found && r.jail_contact);
        setResult(found || notFound || allResults[0]);
      } else if (parish === "St. John the Baptist") {
        // Client-side Zuercher fetch for St. John (server IP is blocked by portal)
        const records = await fetchZuercherClientSide(inmateName.trim());
        if (records.length === 0) {
          // Portal unreachable from this browser — fall back to server (will return not-found with jail contact)
          const res = await fetch("/api/v1/voice-screener", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inmate_name: inmateName.trim(),
              parish,
              caller_budget_available: budget ? parseFloat(budget) : undefined,
            }),
          });
          setResult(await res.json());
        } else {
          const screened = await stjohnScreenMutation.mutateAsync({
            inmate_name: inmateName.trim(),
            caller_budget: budget ? parseFloat(budget) : undefined,
            zuercher_records: records,
          });
          // Normalize stjohn response to match ScreenerResult shape
          const normalized: ScreenerResult = {
            success: true,
            found: screened.found,
            screener_decision: screened.screener_decision,
            inmate_name_confirmed: screened.found ? (screened as any).inmate?.name : undefined,
            inmate_name_searched: screened.inmate_name_searched,
            booking_number: screened.found ? (screened as any).inmate?.bookingNumber : undefined,
            parish: screened.parish,
            total_bond_amount: screened.found ? (screened as any).bond_amount : null,
            calculated_premium: screened.found ? (screened as any).premium_amount : null,
            charges: screened.found ? (screened as any).inmate?.charges : [],
            booking_date: screened.found ? (screened as any).inmate?.bookingDate : undefined,
            voice_prompt_suggestion: screened.found
              ? `I found ${(screened as any).inmate?.name} in the St. John the Baptist Parish jail. Bond is set at ${ (screened as any).bond_amount ? `$${((screened as any).bond_amount as number).toLocaleString()}` : "not yet set" }. The 10% premium is ${ (screened as any).premium_amount ? `$${((screened as any).premium_amount as number).toLocaleString()}` : "pending" }.`
              : screened.voice_prompt_suggestion,
            jail_contact: (screened as any).jail_contact ? {
              facility_name: (screened as any).jail_contact.facility,
              booking_phone: (screened as any).jail_contact.booking_line,
              main_phone: (screened as any).jail_contact.main_line,
              address: (screened as any).jail_contact.address,
              hours: (screened as any).jail_contact.hours,
              notes: "",
              call_script: "",
            } : null,
            workflow_action: !(screened as any).bond_amount ? "CALL_BOOKING_DESK" : "PROCEED",
          };
          setResult(normalized);
        }
      } else {
        const res = await fetch("/api/v1/voice-screener", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inmate_name: inmateName.trim(),
            parish,
            caller_budget_available: budget ? parseFloat(budget) : undefined,
          }),
        });
        setResult(await res.json());
      }
    } catch (err: any) {
      toast.error("Lookup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [inmateName, parish, budget, searchAll, stjohnScreenMutation]);

  const voiceInput = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Voice input not supported"); return; }
    setListening(true);
    const r = new SR();
    r.onresult = (e: any) => setInmateName(e.results[0][0].transcript);
    r.onerror = r.onend = () => setListening(false);
    r.start();
  };

  const decisionKey = result?.screener_decision || result?.decision;
  const decision = decisionKey ? DECISION_CONFIG[decisionKey] || DECISION_CONFIG.NOT_FOUND : null;

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid hsl(var(--border))",
          background: "rgba(245,158,11,0.04)",
        }}
      >
        <PhoneCall size={14} color="var(--bc-amber)" />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
          }}
        >
          Live Screener
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.06em",
          }}
        >
          POST /api/v1/voice-screener
        </span>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          {/* Name */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem" }}>
              Inmate Name
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={inmateName}
                onChange={(e) => setInmateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runLookup()}
                placeholder="e.g. Johnson, Marcus"
                className="bc-input"
                style={{ flex: 1 }}
              />
              <button
                onClick={voiceInput}
                disabled={listening}
                title="Voice input"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 4,
                  border: "1px solid hsl(var(--border))",
                  background: listening ? "var(--bc-amber-dim)" : "hsl(var(--input))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <Mic size={14} color={listening ? "var(--bc-amber)" : "hsl(var(--muted-foreground))"} />
              </button>
            </div>
          </div>

          {/* Parish */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>
                Parish
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={searchAll}
                  onChange={(e) => setSearchAll(e.target.checked)}
                  style={{ accentColor: "var(--bc-amber)", width: 13, height: 13 }}
                />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: searchAll ? "var(--bc-amber)" : "hsl(var(--muted-foreground))" }}>
                  Search All Parishes
                </span>
              </label>
            </div>
            <select value={parish} onChange={(e) => setParish(e.target.value)} className="bc-select" disabled={searchAll} style={{ opacity: searchAll ? 0.4 : 1 }}>
              {ACTIVE_PARISHES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}{p.status === "limited" ? " (custody only)" : ""}
                </option>
              ))}
            </select>
            {searchAll && (
              <div style={{ marginTop: "0.35rem", fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--bc-amber)", letterSpacing: "0.04em" }}>
                ▶ Searching Allen · St. Mary · Evangeline · St. John the Baptist · Plaquemines · St. Bernard simultaneously
              </div>
            )}
          </div>

          {/* Budget */}
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem" }}>
              Caller Budget (optional)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 2500"
              className="bc-input"
            />
          </div>
        </div>

        <button
          onClick={runLookup}
          disabled={loading}
          className="bc-btn-primary"
          style={{ width: "100%", justifyContent: "center", marginBottom: result ? "1rem" : 0 }}
        >
          {loading ? (
            <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Querying Roster…</>
          ) : (
            <><Search size={14} /> Run Screener Lookup</>
          )}
        </button>

        {/* Result */}
        {result && (
          <div
            style={{
              borderRadius: 4,
              border: `1px solid ${decision ? decision.border : "hsl(var(--border))"}`,
              background: decision ? decision.bg : "hsl(var(--accent))",
              padding: "1rem",
            }}
          >
            {result.success && result.found ? (
              <>
                {/* Decision */}
                {decision && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                    <decision.icon size={14} color={decision.color} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.08em", color: decision.color }}>
                      {decision.label}
                    </span>
                    {result.response_time_ms && (
                      <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))" }}>
                        {result.response_time_ms}ms
                      </span>
                    )}
                  </div>
                )}

                {/* Data grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "0.875rem" }}>
                  {[
                    { label: "Confirmed Name", value: result.inmate_name_confirmed || "—" },
                    { label: "Booking #",       value: result.booking_number || "—" },
                    { label: "Bond Amount",     value: fmtUSD(result.total_bond_amount), color: "var(--bc-green)" },
                    { label: "10% Premium",     value: fmtUSD(result.calculated_premium), color: "var(--bc-amber)" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.2rem" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: color || "hsl(var(--foreground))" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charges */}
                {result.charges && result.charges.length > 0 && (
                  <div style={{ marginBottom: "0.875rem" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem" }}>
                      Charges
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {result.charges.slice(0, 5).map((c: string, i: number) => (
                        <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: 3, background: "rgba(0,0,0,0.3)", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice prompt */}
                {(result.voice_prompt_suggestion || result.voice_prompt) && (
                  <div style={{ padding: "0.75rem", borderRadius: 4, background: "rgba(0,0,0,0.3)", border: "1px solid hsl(var(--border))" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
                      <Mic size={11} color="var(--bc-amber)" />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5875rem", fontWeight: 600, color: "var(--bc-amber)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        TTS Voice Prompt
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--foreground))", lineHeight: 1.6, fontStyle: "italic" }}>
                      "{result.voice_prompt_suggestion || result.voice_prompt}"
                    </p>
                  </div>
                )}

                {/* No-bond fallback: show booking desk workflow when bond is not set */}
                {result.workflow_action === "CALL_BOOKING_DESK" && result.jail_contact && (
                  <div style={{ marginTop: "0.875rem" }}>
                    <NoBondWorkflow result={result} />
                  </div>
                )}
              </>
            ) : (
              /* NOT FOUND — show booking desk workflow */
              <NoBondWorkflow result={result} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Parish Status ──────────────────────────────────────────────────────────────

function ParishStatus() {
  const sources = trpc.sources.list.useQuery();

  const PARISH_META: Record<string, { bond: boolean; platform: string }> = {
    "St. John the Baptist": { bond: true,  platform: "Zuercher" },
    "St. Mary":             { bond: true,  platform: "Most Wanted" },
    "Allen":                { bond: true,  platform: "Most Wanted" },
    "Evangeline":           { bond: true,  platform: "Most Wanted" },
    "Jefferson":            { bond: true,  platform: "Zuercher" },
    "Plaquemines":          { bond: false, platform: "LA VINE" },
    "St. Bernard":          { bond: false, platform: "LA VINE" },
    "Orleans":              { bond: false, platform: "Appriss" },
  };

  const rows = sources.data ?? [];

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <MapPin size={14} color="var(--bc-amber)" />
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          Parish Coverage
        </span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))" }}>
          8 jurisdictions
        </span>
      </div>

      <table className="bc-table">
        <thead>
          <tr>
            <th>Parish</th>
            <th>Platform</th>
            <th>Bond Data</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(PARISH_META).map(([name, meta]) => {
            const source = rows.find((s: any) => s.parish === name);
            const count = source?.recordCount ?? 0;
            return (
              <tr key={name}>
                <td style={{ fontWeight: 600 }}>{name}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                  {meta.platform}
                </td>
                <td>
                  <span className={`bc-badge ${meta.bond ? "bc-badge-green" : "bc-badge-slate"}`}>
                    {meta.bond ? "Yes" : "No"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className="bc-status-dot live bc-pulse" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--bc-green)" }}>
                      Live
                    </span>
                    {count > 0 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(var(--muted-foreground))", marginLeft: "0.25rem" }}>
                        · {count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Activity Log ───────────────────────────────────────────────────────────────

function ActivityLog() {
  const logs = trpc.logs.recent.useQuery({ limit: 30 });
  const rows = logs.data ?? [];

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <Activity size={14} color="var(--bc-amber)" />
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          Scrape Activity Log
        </span>
        <button
          onClick={() => logs.refetch()}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer" }}
        >
          <RefreshCw size={11} style={{ animation: logs.isFetching ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {logs.isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", gap: "0.5rem", color: "hsl(var(--muted-foreground))" }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>Loading…</span>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "hsl(var(--muted-foreground))" }}>
          <Activity size={28} style={{ marginBottom: "0.75rem", opacity: 0.3 }} />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>No scrape logs yet.</p>
        </div>
      ) : (
        <table className="bc-table">
          <thead>
            <tr>
              <th>Parish</th>
              <th>Status</th>
              <th>Records</th>
              <th>New</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={row.id || i}>
                <td style={{ fontWeight: 600 }}>{row.parish}</td>
                <td>
                  <span className={`bc-badge ${row.status === "success" ? "bc-badge-green" : "bc-badge-red"}`}>
                    {row.status === "success" ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                    {row.status}
                  </span>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                  {row.recordCount?.toLocaleString() ?? "—"}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: (row.newBookings ?? 0) > 0 ? "var(--bc-amber)" : "hsl(var(--muted-foreground))", fontWeight: (row.newBookings ?? 0) > 0 ? 600 : 400 }}>
                  {row.newBookings ?? 0}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                  {row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s` : "—"}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>
                  {timeAgo(row.scrapedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── API Key Panel ──────────────────────────────────────────────────────────────

function ApiKeyPanel({ user }: { user: any }) {
  const [copied, setCopied] = useState(false);
  const demoKey = `bc_live_${(user?.openId || "demo").substring(0, 8)}xxxxxxxxxxxx`.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));

  const copyKey = () => {
    navigator.clipboard.writeText(demoKey).then(() => {
      setCopied(true);
      toast.success("API key copied");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <Key size={14} color="var(--bc-amber)" />
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          API Integration
        </span>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Endpoint */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem" }}>
            Endpoint
          </div>
          <div className="bc-code" style={{ padding: "0.5rem 0.75rem" }}>
            <span style={{ color: "var(--bc-green)" }}>POST</span>{" "}
            <span style={{ color: "var(--bc-amber)" }}>/api/v1/voice-screener</span>
          </div>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem" }}>
            API Key
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: 4, border: "1px solid hsl(var(--border))", background: "hsl(var(--input))" }}>
            <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {demoKey}
            </span>
            <button
              onClick={copyKey}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: copied ? "var(--bc-green)" : "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
            >
              <Copy size={11} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Code sample */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem" }}>
            Quick Start
          </div>
          <div className="bc-code">
            <div><span style={{ color: "#64748b" }}>{"// POST body"}</span></div>
            <div><span style={{ color: "#f8fafc" }}>{"{"}</span></div>
            <div style={{ paddingLeft: "1rem" }}>
              <span style={{ color: "#fbbf24" }}>"inmate_name"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#86efac" }}>"Johnson, Marcus"</span><span style={{ color: "#64748b" }}>,</span>
            </div>
            <div style={{ paddingLeft: "1rem" }}>
              <span style={{ color: "#fbbf24" }}>"parish"</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: "#86efac" }}>"St. John the Baptist"</span>
            </div>
            <div><span style={{ color: "#f8fafc" }}>{"}"}</span></div>
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
      toast.success(`Refreshed ${ok}/${res.length} sources`);
      stats.refetch();
      setScraping(false);
    },
    onError: (e: any) => { toast.error(e.message); setScraping(false); },
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "hsl(var(--background))" }}>
        <Loader2 size={22} color="var(--bc-amber)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "hsl(var(--background))" }}>
        <div style={{ textAlign: "center", maxWidth: 380, padding: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--bc-amber-dim)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Shield size={24} color="var(--bc-amber)" />
          </div>
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.75rem" }}>Authentication Required</h2>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9375rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
            Access to the BondCurrent command center requires authentication.
          </p>
          <a href={getLoginUrl()} className="bc-btn-primary" style={{ display: "inline-flex", textDecoration: "none", padding: "0.75rem 1.75rem", fontSize: "0.9375rem" }}>
            Sign In <ArrowRight size={15} />
          </a>
          <div style={{ marginTop: "1rem" }}>
            <button onClick={() => setLocation("/")} style={{ fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer" }}>
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
    <div style={{ display: "flex", minHeight: "100vh", background: "hsl(var(--background))" }}>
      <Sidebar user={user} onLogout={logout} onHome={() => setLocation("/")} />

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.5rem",
            borderBottom: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
              Command Center
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>
              Louisiana River Parishes · Real-Time Bond Intelligence
            </div>
          </div>
          <button
            onClick={() => { setScraping(true); scrapeAll.mutate(); }}
            disabled={scraping}
            className="bc-btn-outline"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.875rem" }}
          >
            <RefreshCw size={12} style={{ animation: scraping ? "spin 1s linear infinite" : "none" }} />
            {scraping ? "Refreshing…" : "Refresh All Sources"}
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            <StatCard icon={User}     label="Active Bookings"  value={totalBookings.toLocaleString()} sub="across all parishes" accent="var(--bc-amber)" />
            <StatCard icon={DollarSign} label="Total Bond Value" value={fmtUSD(totalBond)} sub="in current roster" accent="var(--bc-green)" />
            <StatCard icon={MapPin}   label="Parishes Indexed" value={parishBreakdown.length || 8} sub="8 jurisdictions" accent="var(--bc-blue)" />
            <StatCard icon={Zap}      label="API Status"       value="Operational" sub="POST /api/v1/voice-screener" accent="var(--bc-green)" />
          </div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <ScreenerPanel />
            <ApiKeyPanel user={user} />
          </div>

          {/* Full-width */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <ParishStatus />
            <ActivityLog />
          </div>
        </div>
      </div>
    </div>
  );
}
