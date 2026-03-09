import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Mic,
  Search,
  AlertCircle,
  Shield,
  Zap,
  Radio,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  FileText,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const PARISH_META: Record<
  string,
  { bondAvailable: boolean; platform: string; color: string }
> = {
  "St. Mary": {
    bondAvailable: true,
    platform: "Most Wanted CMS",
    color: "#00d9ff",
  },
  Allen: {
    bondAvailable: true,
    platform: "Most Wanted CMS",
    color: "#00d9ff",
  },
  Evangeline: {
    bondAvailable: true,
    platform: "Most Wanted CMS",
    color: "#00d9ff",
  },
  Plaquemines: {
    bondAvailable: false,
    platform: "LA VINE / Appriss",
    color: "#f59e0b",
  },
  "St. Bernard": {
    bondAvailable: false,
    platform: "LA VINE / Appriss",
    color: "#f59e0b",
  },
  Orleans: {
    bondAvailable: false,
    platform: "Appriss OCV API",
    color: "#f59e0b",
  },
  Jefferson: {
    bondAvailable: true,
    platform: "JPSO Custom SPA",
    color: "#00d9ff",
  },
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "charge">("name");
  const [isListening, setIsListening] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const searchResults = trpc.bookings.search.useQuery(
    {
      name: searchType === "name" ? submittedQuery : undefined,
      charge: searchType === "charge" ? submittedQuery : undefined,
    },
    { enabled: submittedQuery.length >= 2 }
  );

  const stats = trpc.dashboard.stats.useQuery();
  const adapters = trpc.sources.adapters.useQuery();
  const scrapeAll = trpc.scrape.all.useMutation({
    onSuccess: (results) => {
      const ok = results.filter((r: any) => r.status === "success").length;
      const total = results.length;
      toast.success(`Refreshed ${ok}/${total} sources`);
      stats.refetch();
      setIsScraping(false);
    },
    onError: (err) => {
      toast.error(`Refresh failed: ${err.message}`);
      setIsScraping(false);
    },
  });

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2) {
      setSubmittedQuery(searchQuery.trim().toUpperCase());
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleVoiceSearch = () => {
    setIsListening(true);
    const SpeechRecognitionClass =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error("Voice search not supported in this browser");
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toUpperCase();
      setSearchQuery(transcript);
      setSubmittedQuery(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleRefresh = () => {
    setIsScraping(true);
    scrapeAll.mutate();
  };

  const results = searchResults.data?.items ?? [];
  const totalBookings = stats.data?.totalBookings ?? 0;
  const totalBond = stats.data?.totalBondValue ?? 0;
  const activeSources = stats.data?.parishBreakdown?.length ?? 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* ── Top Nav ── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(5, 10, 20, 0.85)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Shield size={16} color="#fff" />
            </div>
            <span
              className="text-xl font-bold gradient-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              BondCurrent
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-success)" }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {activeSources} sources live
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isScraping}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <RefreshCw
                size={12}
                className={isScraping ? "animate-spin" : ""}
              />
              {isScraping ? "Refreshing..." : "Refresh All"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary), transparent)",
          }}
        />
        <div className="container relative text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{
              backgroundColor: "rgba(0, 217, 255, 0.1)",
              border: "1px solid rgba(0, 217, 255, 0.3)",
              color: "var(--color-accent)",
            }}
          >
            <Radio size={10} className="animate-pulse" />
            AI-Powered Bond Intelligence
          </div>
          <h1
            className="text-5xl sm:text-6xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="gradient-text">BondCurrent</span>
          </h1>
          <p
            className="text-lg sm:text-xl mb-3"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Real-time inmate bond search across Louisiana river parishes
          </p>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Search by inmate name or charge/offense · Voice-enabled · Updated
            every 30 minutes
          </p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="container mb-8">
        <div
          className="grid grid-cols-3 gap-4 p-4 rounded-xl"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          {[
            {
              icon: User,
              label: "Active Bookings",
              value: totalBookings.toLocaleString(),
            },
            {
              icon: DollarSign,
              label: "Total Bond Value",
              value: `$${(totalBond / 1_000_000).toFixed(1)}M`,
            },
            {
              icon: Zap,
              label: "Live Sources",
              value: `${activeSources} parishes`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon
                size={16}
                className="mx-auto mb-1"
                style={{ color: "var(--color-accent)" }}
              />
              <p
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {value}
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Search ── */}
      <section className="container mb-12">
        <div className="card-glass glow-border p-8">
          {/* Search type toggle */}
          <div className="flex gap-2 mb-5">
            {(["name", "charge"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor:
                    searchType === type
                      ? "var(--color-primary)"
                      : "var(--color-bg-tertiary)",
                  color:
                    searchType === type
                      ? "#fff"
                      : "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {type === "name" ? (
                  <User size={14} />
                ) : (
                  <FileText size={14} />
                )}
                {type === "name" ? "Search by Name" : "Search by Charge"}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder={
                  searchType === "name"
                    ? "SMITH, JOHN  or  JOHN SMITH"
                    : "DWI  or  THEFT  or  POSSESSION"
                }
                className="tech-input w-full pl-10"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                }}
              />
            </div>
            <button
              onClick={handleVoiceSearch}
              disabled={isListening}
              className="btn-primary px-4"
              style={{
                backgroundColor: isListening
                  ? "var(--color-accent)"
                  : "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
              }}
              title="Voice search"
            >
              <Mic
                size={18}
                style={{
                  color: isListening
                    ? "#fff"
                    : "var(--color-text-secondary)",
                }}
                className={isListening ? "animate-pulse" : ""}
              />
            </button>
            <button
              onClick={handleSearch}
              className="btn-primary px-6 font-semibold"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Search
            </button>
          </div>

          {isListening && (
            <div
              className="mt-4 p-3 rounded-lg animate-pulse"
              style={{
                backgroundColor: "rgba(0, 217, 255, 0.08)",
                border: "1px solid rgba(0, 217, 255, 0.3)",
              }}
            >
              <p
                className="text-sm flex items-center gap-2"
                style={{ color: "var(--color-accent)" }}
              >
                <Radio size={12} className="animate-pulse" />
                Listening… speak the name or charge
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Results ── */}
      <section className="container mb-16">
        {submittedQuery && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                Results for &ldquo;{submittedQuery}&rdquo;
              </h2>
              {!searchResults.isLoading && (
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {results.length} record{results.length !== 1 ? "s" : ""}{" "}
                  found
                </span>
              )}
            </div>

            {searchResults.isLoading && (
              <div className="card-glass p-12 text-center">
                <div
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: "var(--color-primary)" }}
                />
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Searching across all parishes…
                </p>
              </div>
            )}

            {!searchResults.isLoading && results.length === 0 && (
              <div className="card-glass p-12 text-center">
                <AlertCircle
                  className="mx-auto mb-4"
                  size={36}
                  style={{ color: "var(--color-warning)" }}
                />
                <p
                  className="font-semibold mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  No records found
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  No inmates matching &ldquo;{submittedQuery}&rdquo; in the
                  current roster. Try refreshing data or check the spelling.
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid gap-4">
                {results.map((inmate: any, idx: number) => {
                  const bond = inmate.bondAmount
                    ? parseFloat(inmate.bondAmount)
                    : null;
                  const hasBond = bond !== null;
                  return (
                    <div
                      key={idx}
                      className="card-glass p-6"
                      style={{
                        borderLeft: `3px solid ${hasBond ? "var(--color-accent)" : "var(--color-warning)"}`,
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3
                              className="text-lg font-bold truncate"
                              style={{
                                color: "var(--color-text)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {inmate.name}
                            </h3>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: hasBond
                                  ? "rgba(0, 217, 255, 0.1)"
                                  : "rgba(245, 158, 11, 0.1)",
                                color: hasBond
                                  ? "var(--color-accent)"
                                  : "var(--color-warning)",
                                border: `1px solid ${hasBond ? "rgba(0, 217, 255, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                              }}
                            >
                              {hasBond ? "Bond Set" : "No Bond"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              <MapPin size={12} />
                              {inmate.parish} Parish
                            </span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              <Clock size={12} />
                              {inmate.bookingTime
                                ? new Date(
                                    inmate.bookingTime
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </span>
                            {inmate.externalBookingId && (
                              <span
                                className="font-mono"
                                style={{
                                  color: "var(--color-text-tertiary)",
                                  fontSize: "11px",
                                }}
                              >
                                #{inmate.externalBookingId}
                              </span>
                            )}
                          </div>
                          {inmate.chargesText && (
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              <span
                                style={{
                                  color: "var(--color-text-tertiary)",
                                }}
                              >
                                Charges:{" "}
                              </span>
                              {inmate.chargesText}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {hasBond ? (
                            <>
                              <p
                                className="text-2xl font-bold gradient-text"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                ${bond!.toLocaleString()}
                              </p>
                              <p
                                className="text-xs"
                                style={{
                                  color: "var(--color-text-tertiary)",
                                }}
                              >
                                Bond Amount
                              </p>
                            </>
                          ) : (
                            <p
                              className="text-sm"
                              style={{ color: "var(--color-warning)" }}
                            >
                              Bond N/A
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Feature cards when no search */}
        {!submittedQuery && (
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Name Search",
                desc: 'Enter "LAST, FIRST" or any partial name to find inmates across all parishes',
              },
              {
                icon: FileText,
                title: "Charge Search",
                desc: 'Search by offense type — "DWI", "THEFT", "POSSESSION" — across all parishes',
              },
              {
                icon: Mic,
                title: "Voice Search",
                desc: "Tap the mic and speak a name or charge for hands-free lookup",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-glass p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(0, 217, 255, 0.1)" }}
                >
                  <Icon size={20} style={{ color: "var(--color-accent)" }} />
                </div>
                <h3
                  className="font-bold mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Parish Source Status ── */}
      <section className="container mb-16">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          Parish Source Status
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(PARISH_META).map(([parish, meta]) => (
            <div
              key={parish}
              className="card-glass p-4 flex items-center justify-between"
            >
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--color-text)" }}
                >
                  {parish} Parish
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {meta.platform}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {meta.bondAvailable ? (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(0, 217, 255, 0.1)",
                      color: "var(--color-accent)",
                    }}
                  >
                    <CheckCircle size={10} />
                    Bond
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      color: "var(--color-warning)",
                    }}
                  >
                    <XCircle size={10} />
                    No Bond
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p
          className="text-xs mt-3"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          * Plaquemines, St. Bernard, and Orleans use the LA VINE / Appriss
          platform which does not expose bond amounts on public rosters.
          Jefferson Parish bond data confirmed but requires Playwright in
          production.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <p>BondCurrent &copy; 2026 &mdash; AI-Powered Bond Intelligence</p>
          <p>
            Data sourced from official Louisiana parish sheriff rosters &amp;
            LA VINE
          </p>
        </div>
      </footer>
    </div>
  );
}
