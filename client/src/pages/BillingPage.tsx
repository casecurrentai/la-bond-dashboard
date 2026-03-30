/**
 * BondCurrent — Billing Page
 * Subscription tier, usage meter, and billing history.
 */
import { useState } from "react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Download,
  ArrowUpRight,
  Phone,
  MapPin,
  Mic,
  BarChart2,
  HeadphonesIcon,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// ── Plan definitions ───────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    calls: 500,
    lines: 1,
    parishes: 5,
    features: ["1 Voice Agent Line", "500 API calls/month", "River Parishes coverage", "Email support"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    calls: 2000,
    lines: 3,
    parishes: 12,
    features: ["3 Voice Agent Lines", "2,000 API calls/month", "Full Louisiana coverage", "Call recordings & transcripts", "Priority support"],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 999,
    calls: 10000,
    lines: -1, // unlimited
    parishes: 64,
    features: ["Unlimited lines", "10,000 API calls/month", "Full Louisiana + API access", "White-label options", "Dedicated support"],
    popular: false,
  },
];

const BILLING_HISTORY = [
  { date: "Mar 1, 2026", description: "Professional Plan", amount: 499, invoiceId: "INV-2026-0003" },
  { date: "Feb 1, 2026", description: "Professional Plan", amount: 499, invoiceId: "INV-2026-0002" },
  { date: "Jan 1, 2026", description: "Professional Plan", amount: 499, invoiceId: "INV-2026-0001" },
  { date: "Dec 1, 2025", description: "Professional Plan", amount: 499, invoiceId: "INV-2025-0012" },
  { date: "Nov 1, 2025", description: "Professional Plan", amount: 499, invoiceId: "INV-2025-0011" },
];

function UsageBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = Math.min((used / total) * 100, 100);
  const warn = pct >= 80;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--foreground))", fontWeight: 600 }}>
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: warn ? "#f59e0b" : "hsl(var(--muted-foreground))" }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div style={{ height: 6, background: "hsl(var(--border))", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: warn ? "#f59e0b" : color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const currentPlan = "pro";
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plan = PLANS.find(p => p.id === currentPlan)!;
  const usedCalls = 1247;
  const nextBilling = "April 1, 2026";

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          Billing
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
          Subscription · Usage · Invoices
        </div>
      </div>

      {/* Current subscription card */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Star size={14} color="var(--bc-amber)" fill="var(--bc-amber)" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Professional Plan
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", background: "rgba(245,158,11,0.15)", color: "var(--bc-amber)", padding: "0.15rem 0.5rem", borderRadius: 4, border: "1px solid rgba(245,158,11,0.3)" }}>
                ACTIVE
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
              $499<span style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>/month</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: "0.375rem" }}>
              Next billing date: {nextBilling}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
              <CreditCard size={13} /> Visa ····4242
            </div>
            <button
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", background: "transparent", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--muted-foreground))", fontSize: "0.8125rem", cursor: "pointer" }}
              onClick={() => toast.info("Redirecting to Stripe portal (demo)")}
            >
              Manage Payment
            </button>
          </div>
        </div>

        {/* Included features */}
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid hsl(var(--border))", display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {plan.features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
              <CheckCircle2 size={11} color="var(--bc-green)" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Usage this month */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
          <BarChart2 size={14} color="var(--bc-blue)" />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Usage This Month
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))" }}>
            March 2026
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              API Calls
            </div>
            <UsageBar used={usedCalls} total={2000} color="var(--bc-blue)" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              Voice Agent Lines
            </div>
            <UsageBar used={2} total={3} color="var(--bc-green)" />
          </div>
        </div>
        <div style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
          Overages: $0 (none) · Resets April 1, 2026
        </div>
      </div>

      {/* Plan comparison */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, overflow: "hidden", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.25rem", borderBottom: "1px solid hsl(var(--border))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Zap size={14} color="var(--bc-amber)" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Available Plans
            </span>
          </div>
          <div style={{ display: "flex", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6, overflow: "hidden" }}>
            {(["monthly", "annual"] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                style={{
                  padding: "0.3rem 0.75rem", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-mono)", fontSize: "0.7rem", textTransform: "uppercase",
                  background: billingCycle === cycle ? "var(--bc-amber)" : "transparent",
                  color: billingCycle === cycle ? "white" : "hsl(var(--muted-foreground))",
                  transition: "all 0.15s",
                }}
              >
                {cycle === "annual" ? "Annual (−20%)" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          {PLANS.map((p, i) => {
            const isCurrent = p.id === currentPlan;
            const price = billingCycle === "annual" ? Math.round(p.price * 0.8) : p.price;
            return (
              <div
                key={p.id}
                style={{
                  padding: "1.25rem",
                  borderRight: i < 2 ? "1px solid hsl(var(--border))" : "none",
                  background: p.popular ? "rgba(245,158,11,0.04)" : "transparent",
                  position: "relative",
                }}
              >
                {p.popular && (
                  <div style={{ position: "absolute", top: 10, right: 10, fontFamily: "var(--font-mono)", fontSize: "0.55rem", background: "var(--bc-amber)", color: "white", padding: "0.15rem 0.5rem", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "0.875rem" }}>
                  ${price}<span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                      <CheckCircle2 size={11} color="var(--bc-green)" style={{ flexShrink: 0, marginTop: 2 }} /> {f}
                    </div>
                  ))}
                </div>
                {isCurrent ? (
                  <div style={{ padding: "0.45rem 0.875rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
                    Current Plan
                  </div>
                ) : (
                  <button
                    style={{ width: "100%", padding: "0.5rem", background: p.popular ? "var(--bc-amber)" : "transparent", border: `1px solid ${p.popular ? "var(--bc-amber)" : "hsl(var(--border))"}`, borderRadius: 6, color: p.popular ? "white" : "hsl(var(--foreground))", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => toast.info(`Upgrade to ${p.name} (demo)`)}
                  >
                    {p.id === "agency" ? "Contact Sales" : `Upgrade to ${p.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1.25rem", borderBottom: "1px solid hsl(var(--border))" }}>
          <CreditCard size={14} color="var(--bc-amber)" />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Billing History
          </span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              {["Date", "Description", "Amount", "Invoice"].map(h => (
                <th key={h} style={{ padding: "0.625rem 1.25rem", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BILLING_HISTORY.map((row, i) => (
              <tr key={row.invoiceId} style={{ borderBottom: i < BILLING_HISTORY.length - 1 ? "1px solid hsl(var(--border))" : "none" }}>
                <td style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
                  {row.date}
                </td>
                <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>
                  {row.description}
                </td>
                <td style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>
                  ${row.amount.toLocaleString()}.00
                </td>
                <td style={{ padding: "0.75rem 1.25rem" }}>
                  <button
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", cursor: "pointer", color: "var(--bc-blue)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: 0 }}
                    onClick={() => toast.info(`Downloading ${row.invoiceId} (demo)`)}
                  >
                    <Download size={12} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel subscription */}
      <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>Cancel Subscription</div>
          <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>Your access will continue until April 1, 2026.</div>
        </div>
        <button
          style={{ padding: "0.45rem 0.875rem", background: "transparent", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 6, color: "#ef4444", fontSize: "0.8125rem", cursor: "pointer" }}
          onClick={() => toast.error("Cancellation request sent (demo)")}
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}
