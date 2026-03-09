import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mic, Search, AlertCircle } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "charge">("name");
  const [isListening, setIsListening] = useState(false);

  const searchResults = trpc.bookings.search.useQuery(
    { name: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const handleVoiceSearch = async () => {
    setIsListening(true);
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      if (!SpeechRecognition) {
        alert("Voice search not supported in your browser");
        setIsListening(false);
        return;
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Voice search error:", error);
      setIsListening(false);
    }
  };

  const results = searchResults.data?.items || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, var(--color-primary), transparent 50%)",
        }}></div>
        
        <div className="container relative py-16 sm:py-24">
          <div className="text-center">
            <h1 className="mb-4 text-5xl font-bold" style={{ color: "var(--color-text)" }}>
              <span className="gradient-text">BondCurrent</span>
            </h1>
            <p className="mb-8 text-xl" style={{ color: "var(--color-text-secondary)" }}>
              AI-Powered Inmate Bond Intelligence for Law Enforcement
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Real-time bond information across Louisiana river parishes
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container py-12">
        <div className="card-glass glow-border p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Search Type
            </label>
            <div className="flex gap-4">
              {(["name", "charge"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value={type}
                    checked={searchType === type}
                    onChange={(e) => setSearchType(e.target.value as "name" | "charge")}
                    className="w-4 h-4"
                  />
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {type === "name" ? "Inmate Name" : "Charge/Offense"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Enter ${searchType === "name" ? "inmate name" : "charge"}...`}
              className="tech-input flex-1"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
            <button
              onClick={handleVoiceSearch}
              disabled={isListening}
              className="btn-primary"
              style={{
                backgroundColor: isListening ? "var(--color-accent)" : "var(--color-primary)",
              }}
              title="Voice search (beta)"
            >
              <Mic size={20} />
            </button>
            <button
              className="btn-primary"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Search size={20} />
            </button>
          </div>

          {isListening && (
            <div className="mt-4 p-3 rounded-md animate-pulse-glow" style={{
              backgroundColor: "rgba(0, 217, 255, 0.1)",
              borderColor: "var(--color-accent)",
              borderWidth: "1px",
            }}>
              <p style={{ color: "var(--color-accent)" }} className="text-sm">
                Listening... speak your search query
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="container py-12">
        {searchQuery && (
          <>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
              Search Results
            </h2>

            {searchResults.isLoading && (
              <div className="card-glass p-8 text-center">
                <p style={{ color: "var(--color-text-secondary)" }}>Searching...</p>
              </div>
            )}

            {!searchResults.isLoading && results.length === 0 && (
              <div className="card-glass p-8 text-center">
                <AlertCircle className="mx-auto mb-4" size={32} style={{ color: "var(--color-warning)" }} />
                <p style={{ color: "var(--color-text-secondary)" }}>
                  No inmates found matching "{searchQuery}"
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid gap-4">
                {results.map((inmate: any, idx: number) => (
                  <div key={idx} className="card-glass p-6 border-l-4" style={{
                    borderLeftColor: "var(--color-accent)",
                    backgroundColor: "var(--color-bg-secondary)",
                  }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                          {inmate.name}
                        </h3>
                        <p style={{ color: "var(--color-text-tertiary)" }} className="text-sm">
                          {inmate.parish} Parish
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold gradient-text">
                          ${parseFloat(inmate.bondAmount || "0").toLocaleString()}
                        </p>
                        <p style={{ color: "var(--color-text-tertiary)" }} className="text-xs">
                          Bond Amount
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p style={{ color: "var(--color-text-tertiary)" }}>Booking ID</p>
                        <p style={{ color: "var(--color-text)" }} className="font-mono">
                          {inmate.externalBookingId}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--color-text-tertiary)" }}>Booked</p>
                        <p style={{ color: "var(--color-text)" }}>
                          {new Date(inmate.bookingTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!searchQuery && (
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Multi-Parish Search",
                desc: "Search across all Louisiana river parishes in one query",
              },
              {
                icon: "🎤",
                title: "Voice Search",
                desc: "Use voice commands to search for inmates and charges",
              },
              {
                icon: "⚡",
                title: "Real-Time Data",
                desc: "Updated every 30 minutes from official sources",
              },
            ].map((feature, idx) => (
              <div key={idx} className="card-glass p-6 text-center">
                <p className="text-4xl mb-3">{feature.icon}</p>
                <h3 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  {feature.title}
                </h3>
                <p style={{ color: "var(--color-text-secondary)" }} className="text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: "var(--color-border)" }}>
        <div className="container py-8 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          <p>BondCurrent © 2026 | AI-Powered Law Enforcement Intelligence</p>
        </div>
      </footer>
    </div>
  );
}
