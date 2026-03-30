/**
 * BondCurrent — Calls Log Page
 * Filterable, sortable table of all voice screener calls with detail modal.
 */
import { useState, useMemo } from "react";
import {
  Phone,
  PhoneForwarded,
  PhoneMissed,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  ChevronUp,
  ChevronDown,
  X,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Mic,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { MOCK_CALLS, getCallStats, type MockCall, type CallDecision } from "@/data/mockCalls";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtUSD(n: number | null) {
  if (n === null) return "—";
  return "$" + n.toLocaleString();
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const DECISION_META: Record<CallDecision, { label: string; color: string; icon: React.ReactNode }> = {
  QUALIFIED:             { label: "Qualified",      color: "var(--bc-green)",  icon: <CheckCircle2 size={12} /> },
  UNQUALIFIED:           { label: "Unqualified",    color: "#ef4444",          icon: <XCircle size={12} /> },
  PAYMENT_PLAN_ELIGIBLE: { label: "Payment Plan",   color: "var(--bc-amber)",  icon: <Clock size={12} /> },
  NEEDS_MANUAL_REVIEW:   { label: "Needs Review",   color: "var(--bc-blue)",   icon: <AlertCircle size={12} /> },
};

function DecisionBadge({ decision }: { decision: CallDecision }) {
  const meta = DECISION_META[decision];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.55rem", borderRadius: 4,
      background: meta.color + "22", color: meta.color,
      fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700,
      letterSpacing: "0.04em", textTransform: "uppercase",
      border: `1px solid ${meta.color}44`,
    }}>
      {meta.icon}{meta.label}
    </span>
  );
}

// ── Call Detail Modal ──────────────────────────────────────────────────────────

function CallDetailModal({ call, onClose }: { call: MockCall; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
          borderRadius: 10, width: "100%", maxWidth: 720, maxHeight: "90vh",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem", borderBottom: "1px solid hsl(var(--border))",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Call Details
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
              {call.callId} · {fmtTime(call.timestamp)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <DecisionBadge decision={call.decision} />
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4, display: "flex" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Two-column info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Caller */}
            <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <User size={13} color="var(--bc-amber)" />
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Caller</span>
              </div>
              <InfoRow label="Name" value={call.callerName} />
              <InfoRow label="Phone" value={call.callerPhone} />
              <InfoRow label="Budget" value={fmtUSD(call.callerBudget)} />
              <InfoRow label="Duration" value={fmtDuration(call.duration)} />
            </div>
            {/* Inmate */}
            <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <MapPin size={13} color="var(--bc-amber)" />
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Inmate</span>
              </div>
              <InfoRow label="Name" value={call.inmateName} mono />
              <InfoRow label="Parish" value={call.parish} />
              <InfoRow label="Booking #" value={call.bookingNumber ?? "—"} mono />
              <InfoRow label="Bond" value={fmtUSD(call.bondAmount)} />
            </div>
          </div>

          {/* Financial summary */}
          <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <DollarSign size={13} color="var(--bc-green)" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Financial Summary</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <FinStat label="Total Bond" value={fmtUSD(call.bondAmount)} color="hsl(var(--foreground))" />
              <FinStat label="10% Premium" value={fmtUSD(call.premium)} color="var(--bc-green)" />
              <FinStat label="Caller Budget" value={fmtUSD(call.callerBudget)} color="var(--bc-amber)" />
            </div>
            {call.charges.length > 0 && (
              <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid hsl(var(--border))" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Charges</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {call.charges.map((c, i) => (
                    <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", background: "rgba(245,158,11,0.1)", color: "var(--bc-amber)", padding: "0.2rem 0.5rem", borderRadius: 4, border: "1px solid rgba(245,158,11,0.2)" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transfer status */}
          <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <PhoneForwarded size={13} color="var(--bc-blue)" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Outcome</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <DecisionBadge decision={call.decision} />
              {call.transferStatus === "transferred" ? (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--bc-green)" }}>
                  ✓ Transferred to {call.transferredTo}
                </span>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
                  Not transferred
                </span>
              )}
            </div>
          </div>

          {/* AI Summary */}
          <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <FileText size={13} color="var(--bc-amber)" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>AI Summary</span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(var(--foreground))", margin: 0 }}>
              {call.summary}
            </p>
          </div>

          {/* Transcript (if available) */}
          {call.transcript.length > 0 && (
            <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                <Mic size={13} color="var(--bc-blue)" />
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Transcript</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {call.transcript.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "hsl(var(--muted-foreground))",
                      flexShrink: 0, paddingTop: "0.2rem", minWidth: 32,
                    }}>{line.timestamp}</span>
                    <div style={{
                      flex: 1, padding: "0.5rem 0.75rem", borderRadius: 6,
                      background: line.role === "assistant" ? "rgba(59,130,246,0.08)" : "rgba(245,158,11,0.08)",
                      border: `1px solid ${line.role === "assistant" ? "rgba(59,130,246,0.15)" : "rgba(245,158,11,0.15)"}`,
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: line.role === "assistant" ? "var(--bc-blue)" : "var(--bc-amber)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {line.role === "assistant" ? "AI Agent" : "Caller"}
                      </div>
                      <div style={{ fontSize: "0.8125rem", lineHeight: 1.5, color: "hsl(var(--foreground))" }}>{line.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio player (mock UI) */}
          <div style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Mic size={13} color="hsl(var(--muted-foreground))" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Recording</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <button
                style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bc-amber-dim)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--bc-amber)" }}
                onClick={() => {}}
                title="Play recording (demo)"
              >
                ▶
              </button>
              <div style={{ flex: 1, height: 4, background: "hsl(var(--border))", borderRadius: 2, position: "relative" }}>
                <div style={{ width: "35%", height: "100%", background: "var(--bc-amber)", borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", flexShrink: 0 }}>
                {fmtDuration(Math.floor(call.duration * 0.35))} / {fmtDuration(call.duration)}
              </span>
            </div>
            <div style={{ marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "hsl(var(--muted-foreground))" }}>
              Recording playback available in production deployment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : "inherit", fontSize: "0.8125rem", color: "hsl(var(--foreground))", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function FinStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ── Main Calls Log ─────────────────────────────────────────────────────────────

type SortField = "timestamp" | "parish" | "bondAmount" | "decision" | "duration";
type SortDir = "asc" | "desc";

const ALL_PARISHES = Array.from(new Set(MOCK_CALLS.map(c => c.parish))).sort();
const ALL_DECISIONS: CallDecision[] = ["QUALIFIED", "UNQUALIFIED", "PAYMENT_PLAN_ELIGIBLE", "NEEDS_MANUAL_REVIEW"];

export default function CallsLog() {
  const [search, setSearch] = useState("");
  const [parishFilter, setParishFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedCall, setSelectedCall] = useState<MockCall | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const stats = getCallStats();

  const filtered = useMemo(() => {
    let rows = [...MOCK_CALLS];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(c =>
        c.callerName.toLowerCase().includes(q) ||
        c.inmateName.toLowerCase().includes(q) ||
        c.parish.toLowerCase().includes(q) ||
        (c.bookingNumber ?? "").toLowerCase().includes(q)
      );
    }
    if (parishFilter !== "all") rows = rows.filter(c => c.parish === parishFilter);
    if (decisionFilter !== "all") rows = rows.filter(c => c.decision === decisionFilter);
    rows.sort((a, b) => {
      let av: any, bv: any;
      if (sortField === "timestamp") { av = a.timestamp; bv = b.timestamp; }
      else if (sortField === "parish") { av = a.parish; bv = b.parish; }
      else if (sortField === "bondAmount") { av = a.bondAmount ?? -1; bv = b.bondAmount ?? -1; }
      else if (sortField === "decision") { av = a.decision; bv = b.decision; }
      else if (sortField === "duration") { av = a.duration; bv = b.duration; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [search, parishFilter, decisionFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown size={11} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  }

  function exportCSV() {
    const headers = ["Call ID", "Date", "Caller", "Phone", "Inmate", "Parish", "Bond", "Premium", "Budget", "Decision", "Transfer", "Duration"];
    const rows = filtered.map(c => [
      c.callId, fmtTime(c.timestamp), c.callerName, c.callerPhone,
      c.inmateName, c.parish, c.bondAmount ?? "", c.premium ?? "",
      c.callerBudget, c.decision, c.transferStatus, c.duration,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bondcurrent-calls.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          Call Logs
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
          Voice screener history · {MOCK_CALLS.length} total calls
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Today's Calls", value: stats.today.totalCalls, color: "var(--bc-amber)" },
          { label: "Qualified", value: `${stats.today.qualified} (${Math.round(stats.today.qualified / Math.max(stats.today.totalCalls, 1) * 100)}%)`, color: "var(--bc-green)" },
          { label: "Transferred", value: stats.today.transferred, color: "var(--bc-blue)" },
          { label: "Avg Premium", value: fmtUSD(stats.today.avgPremium), color: "var(--bc-green)" },
        ].map(s => (
          <div key={s.label} style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "0.875rem 1rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
          <input
            type="text"
            placeholder="Search caller, inmate, parish…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem",
              background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
              borderRadius: 6, color: "hsl(var(--foreground))", fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        {/* Parish filter */}
        <select
          value={parishFilter}
          onChange={e => setParishFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--foreground))", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", cursor: "pointer" }}
        >
          <option value="all">All Parishes</option>
          {ALL_PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {/* Decision filter */}
        <select
          value={decisionFilter}
          onChange={e => setDecisionFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--foreground))", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", cursor: "pointer" }}
        >
          <option value="all">All Decisions</option>
          {ALL_DECISIONS.map(d => <option key={d} value={d}>{DECISION_META[d].label}</option>)}
        </select>
        {/* Export */}
        <button
          onClick={exportCSV}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", background: "transparent", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", fontFamily: "var(--font-mono)", cursor: "pointer" }}
        >
          <Download size={12} /> Export CSV
        </button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", marginLeft: "auto" }}>
          {filtered.length} results
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                {[
                  { label: "Time", field: "timestamp" as SortField },
                  { label: "Caller", field: null },
                  { label: "Inmate", field: null },
                  { label: "Parish", field: "parish" as SortField },
                  { label: "Bond", field: "bondAmount" as SortField },
                  { label: "Decision", field: "decision" as SortField },
                  { label: "Transfer", field: null },
                  { label: "Duration", field: "duration" as SortField },
                ].map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.field && toggleSort(col.field)}
                    style={{
                      padding: "0.625rem 0.875rem", textAlign: "left",
                      fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                      color: "hsl(var(--muted-foreground))", textTransform: "uppercase",
                      letterSpacing: "0.06em", fontWeight: 600,
                      cursor: col.field ? "pointer" : "default",
                      userSelect: "none", whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      {col.label}
                      {col.field && <SortIcon field={col.field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((call, idx) => (
                <tr
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? "1px solid hsl(var(--border))" : "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--muted)/0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>
                    {fmtTime(call.timestamp)}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", fontWeight: 500 }}>
                    {call.callerName}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--foreground))" }}>
                    {call.inmateName}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
                    {call.parish}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, color: call.bondAmount ? "var(--bc-green)" : "hsl(var(--muted-foreground))" }}>
                    {fmtUSD(call.bondAmount)}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <DecisionBadge decision={call.decision} />
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {call.transferStatus === "transferred" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--bc-green)" }}>
                        <PhoneForwarded size={11} /> {call.transferredTo}
                      </span>
                    ) : (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
                    {fmtDuration(call.duration)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    No calls match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedCall && (
        <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}
