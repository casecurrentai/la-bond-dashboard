/**
 * BondCurrent — Configuration Page
 * Voice agent settings, financial thresholds, parish coverage, API key management.
 */
import { useState } from "react";
import {
  Phone,
  DollarSign,
  MapPin,
  Key,
  Save,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  Settings,
  MessageSquare,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, overflow: "hidden", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1.25rem", borderBottom: "1px solid hsl(var(--border))" }}>
        {icon}
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "1.25rem" }}>
        {children}
      </div>
    </div>
  );
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1rem", alignItems: "start", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid hsl(var(--border)/0.5)" }}>
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: "0.25rem" }}>{label}</div>
        {hint && <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "0.5rem 0.75rem",
        background: "hsl(var(--background))", border: "1px solid hsl(var(--border))",
        borderRadius: 6, color: "hsl(var(--foreground))", fontSize: "0.875rem",
        fontFamily: mono ? "var(--font-mono)" : "inherit", outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, position: "relative",
          background: checked ? "var(--bc-green)" : "hsl(var(--border))",
          transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%", background: "white",
          transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>{label}</span>
    </label>
  );
}

const PARISH_LIST = [
  "Allen", "Ascension", "Assumption", "Evangeline",
  "Plaquemines", "St. Bernard", "St. Charles", "St. James",
  "St. John the Baptist", "St. Mary",
];

export default function ConfigPage() {
  // Phone settings
  const [transferPhone, setTransferPhone] = useState("(504) 555-7890");
  const [backupPhone, setBackupPhone] = useState("(504) 555-7891");

  // Financial settings
  const [minBudget, setMinBudget] = useState("100");
  const [paymentPlans, setPaymentPlans] = useState(true);
  const [minDownPct, setMinDownPct] = useState("50");

  // Parish coverage
  const [activeParishes, setActiveParishes] = useState<Set<string>>(
    new Set(["Allen", "Ascension", "Evangeline", "St. John the Baptist", "St. Mary"])
  );

  // Voice agent
  const [greeting, setGreeting] = useState("Good [morning/afternoon/evening], this is the automated intake line for [Your Company]. How can I help you today?");
  const [systemPrompt, setSystemPrompt] = useState("You are a professional, friendly AI assistant for a bail bonds company. Be helpful, empathetic, and efficient. Always verify spelling of names. Use a warm, reassuring tone.");

  // API key
  const [showKey, setShowKey] = useState(false);
  const apiKey = "sk_live_bc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

  const [saved, setSaved] = useState(false);

  function toggleParish(p: string) {
    setActiveParishes(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function handleSave() {
    setSaved(true);
    toast.success("Configuration saved");
    setTimeout(() => setSaved(false), 2000);
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey).then(() => toast.success("API key copied"));
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 860 }}>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "hsl(var(--foreground))" }}>
          Configuration
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
          Voice agent settings · Financial thresholds · Parish coverage
        </div>
      </div>

      {/* Phone Configuration */}
      <Section icon={<Phone size={14} color="var(--bc-amber)" />} title="Phone Configuration">
        <FormRow label="Transfer Phone Number" hint="Qualified calls will be transferred to this number.">
          <TextInput value={transferPhone} onChange={setTransferPhone} placeholder="(504) 555-0000" mono />
        </FormRow>
        <FormRow label="Backup Number" hint="Used if the primary line is busy or unavailable.">
          <TextInput value={backupPhone} onChange={setBackupPhone} placeholder="(504) 555-0001" mono />
        </FormRow>
        <div>
          <button
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--muted-foreground))", fontSize: "0.8125rem", cursor: "pointer" }}
            onClick={() => toast.info("Test call initiated (demo)")}
          >
            <Phone size={13} /> Test Call Transfer
          </button>
        </div>
      </Section>

      {/* Financial Settings */}
      <Section icon={<DollarSign size={14} color="var(--bc-green)" />} title="Financial Settings">
        <FormRow label="Minimum Budget Threshold" hint="Calls below this amount are automatically disqualified.">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}>$</span>
            <TextInput value={minBudget} onChange={setMinBudget} placeholder="100" mono />
          </div>
        </FormRow>
        <FormRow label="Payment Plans" hint="Allow callers to qualify with a partial down payment.">
          <Toggle checked={paymentPlans} onChange={setPaymentPlans} label="Enable payment plans" />
        </FormRow>
        {paymentPlans && (
          <FormRow label="Minimum Down Payment" hint="Minimum percentage of premium required upfront.">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TextInput value={minDownPct} onChange={setMinDownPct} placeholder="50" mono />
              <span style={{ fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))", flexShrink: 0 }}>% of premium</span>
            </div>
          </FormRow>
        )}
      </Section>

      {/* Parish Coverage */}
      <Section icon={<MapPin size={14} color="var(--bc-blue)" />} title="Parish Coverage">
        <div style={{ marginBottom: "0.875rem", fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
          Select which parishes your voice agent will screen calls for. Your current plan includes up to 5 parishes.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
          {PARISH_LIST.map(p => {
            const active = activeParishes.has(p);
            const atLimit = activeParishes.size >= 5 && !active;
            return (
              <label
                key={p}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.625rem 0.875rem", borderRadius: 6,
                  border: `1px solid ${active ? "rgba(59,130,246,0.4)" : "hsl(var(--border))"}`,
                  background: active ? "rgba(59,130,246,0.08)" : "hsl(var(--background))",
                  cursor: atLimit ? "not-allowed" : "pointer",
                  opacity: atLimit ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  disabled={atLimit}
                  onChange={() => toggleParish(p)}
                  style={{ display: "none" }}
                />
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: active ? "var(--bc-blue)" : "transparent",
                  border: `2px solid ${active ? "var(--bc-blue)" : "hsl(var(--border))"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <CheckCircle2 size={10} color="white" />}
                </div>
                <span style={{ fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>{p}</span>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: "0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))" }}>
          {activeParishes.size}/5 parishes active on Starter plan ·{" "}
          <span style={{ color: "var(--bc-amber)", cursor: "pointer" }} onClick={() => toast.info("Upgrade to Pro for all 12 parishes")}>
            Upgrade to Pro for all 12 parishes →
          </span>
        </div>
      </Section>

      {/* Voice Agent Personality */}
      <Section icon={<MessageSquare size={14} color="var(--bc-amber)" />} title="Voice Agent Personality">
        <FormRow label="Greeting Message" hint="The first message your AI agent says when a caller connects.">
          <textarea
            value={greeting}
            onChange={e => setGreeting(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "0.625rem 0.75rem",
              background: "hsl(var(--background))", border: "1px solid hsl(var(--border))",
              borderRadius: 6, color: "hsl(var(--foreground))", fontSize: "0.875rem",
              fontFamily: "inherit", outline: "none", resize: "vertical",
              boxSizing: "border-box", lineHeight: 1.5,
            }}
          />
        </FormRow>
        <FormRow label="System Prompt" hint="Instructions that shape your AI agent's personality and behavior.">
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "0.625rem 0.75rem",
              background: "hsl(var(--background))", border: "1px solid hsl(var(--border))",
              borderRadius: 6, color: "hsl(var(--foreground))", fontSize: "0.875rem",
              fontFamily: "inherit", outline: "none", resize: "vertical",
              boxSizing: "border-box", lineHeight: 1.5,
            }}
          />
        </FormRow>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            style={{ padding: "0.45rem 0.875rem", background: "transparent", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--muted-foreground))", fontSize: "0.8125rem", cursor: "pointer" }}
            onClick={() => {
              setGreeting("Good [morning/afternoon/evening], this is the automated intake line for [Your Company]. How can I help you today?");
              setSystemPrompt("You are a professional, friendly AI assistant for a bail bonds company. Be helpful, empathetic, and efficient. Always verify spelling of names. Use a warm, reassuring tone.");
              toast.success("Reset to defaults");
            }}
          >
            Reset to Default
          </button>
        </div>
      </Section>

      {/* API Access */}
      <Section icon={<Key size={14} color="var(--bc-amber)" />} title="API Access">
        <div style={{ marginBottom: "0.875rem", fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
          Use this key to call <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", background: "hsl(var(--background))", padding: "0.1rem 0.4rem", borderRadius: 4, border: "1px solid hsl(var(--border))" }}>POST /api/v1/voice-screener</code> from your voice agent platform (Vapi, Retell, Bland AI, etc.).
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 6, marginBottom: "0.875rem" }}>
          <Zap size={13} color="var(--bc-amber)" style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "hsl(var(--foreground))" }}>
            {showKey ? apiKey : "sk_live_bc_" + "•".repeat(28)}
          </span>
          <button onClick={() => setShowKey(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", display: "flex", padding: 4 }}>
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={copyKey} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", display: "flex", padding: 4 }}>
            <Copy size={14} />
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          <button
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.875rem", background: "transparent", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--muted-foreground))", fontSize: "0.8125rem", cursor: "pointer" }}
            onClick={() => toast.info("Key regenerated (demo)")}
          >
            <RefreshCw size={12} /> Regenerate Key
          </button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))" }}>
            Usage this month: 1,247 / 2,000 calls
          </span>
        </div>
      </Section>

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
        <button
          onClick={handleSave}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 1.5rem", borderRadius: 6,
            background: saved ? "var(--bc-green)" : "var(--bc-amber)",
            border: "none", color: "white", fontSize: "0.875rem", fontWeight: 700,
            cursor: "pointer", transition: "background 0.2s",
          }}
        >
          {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
