import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import ParishMap from "@/components/ParishMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const HERO_BG_URL =
  "https://private-us-east-1.manuscdn.com/sessionFile/adC2m7uxZoVGJHt79kq5wo/sandbox/YTNQXZbYV8iJJZm551hszQ-img-1_1772057648000_na1fn_aGVyby1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvYWRDMm03dXhab1ZHSkh0NzlrcTV3by9zYW5kYm94L1lUTlFYWmJZVjhpSkpabTU1MWhzelEtaW1nLTFfMTc3MjA1NzY0ODAwMF9uYTFmbl9hR1Z5YnkxaVp3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=C5GNAAxZjJPzIJTH-SIdZ1zPcRZcIUW40XDqFa1pGes16RWtqWiOBXyaEKSqewlrum74Hn9AhU4~jamE961kroSx1ZHP7SWZzJKh0S8yuNB0yiRAsaihZ03FJpo7VSf7mAZQEMjm0dADujE~veJL8qgEMb-IxVO8xQstT3WWDmLHbBeghHmXRgwOcAklN3jPgIrzpmX4-jZKFRNSTECrfQSKcRO4mrqhUdo0taM0buTcB-RwK6mTyMdtaupqjOkZ7ZpbduKE2xsWVbGT4rIOOrmNVIeVdnUkxwFAGEq-U7YZfxx~bOk0eSk-8K0fJsg-pybo6GUKvgF-rR6GZEOncQ__";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function Home() {
  const [selectedParish, setSelectedParish] = useState<string | null>(null);

  const statsQuery = trpc.dashboard.stats.useQuery();
  const scrapeAll = trpc.scrape.all.useMutation({
    onSuccess: (results) => {
      const total = results.reduce((s, r) => s + r.recordCount, 0);
      toast.success(`Scraped ${total} bookings from ${results.length} parishes`);
      statsQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Scrape failed: ${err.message}`);
    },
  });

  const stats = statsQuery.data;
  const parishData = useMemo(
    () =>
      stats?.parishBreakdown?.map((p) => ({
        parish: p.parish,
        count: Number(p.count),
        totalBond: Number(p.totalBond),
      })) ?? [],
    [stats]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${HERO_BG_URL})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="container relative py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs font-medium border-bayou/30 text-bayou bg-bayou/5">
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="text-xs font-medium border-terracotta/30 text-terracotta">
                3 Parishes
              </Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
              Louisiana Bond Alerts
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Real-time bond monitoring from public sheriff inmate rosters across
              St. Mary, Allen, and Evangeline parishes.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={() => scrapeAll.mutate()}
                disabled={scrapeAll.isPending}
                className="bg-bayou hover:bg-bayou-light text-cream gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${scrapeAll.isPending ? "animate-spin" : ""}`} />
                {scrapeAll.isPending ? "Scraping..." : "Refresh All Data"}
              </Button>
              <Link href="/bookings">
                <Button variant="outline" className="gap-2">
                  View All Bookings <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container -mt-2 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Bookings"
            value={stats ? formatNumber(stats.activeBookings) : undefined}
            icon={Users}
            description="Currently in custody"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            title="Total Bond Value"
            value={stats ? formatCurrency(Number(stats.totalBondValue)) : undefined}
            icon={DollarSign}
            description="Across all parishes"
            loading={statsQuery.isLoading}
            accent
          />
          <StatsCard
            title="Avg Bond Amount"
            value={stats ? formatCurrency(Number(stats.avgBondAmount)) : undefined}
            icon={TrendingUp}
            description="Per booking"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            title="Parishes Monitored"
            value="3"
            icon={MapPin}
            description="St. Mary, Allen, Evangeline"
            loading={false}
          />
        </div>
      </section>

      {/* Main Content: Map + Recent Bookings */}
      <section className="container pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Parish Map */}
          <Card className="lg:col-span-1 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Parish Activity Map</CardTitle>
            </CardHeader>
            <CardContent>
              <ParishMap
                data={parishData}
                selectedParish={selectedParish}
                onParishClick={setSelectedParish}
              />
              {selectedParish && (
                <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{selectedParish} Parish</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setSelectedParish(null)}
                    >
                      Clear
                    </Button>
                  </div>
                  {parishData.find((p) => p.parish === selectedParish) && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Bookings</span>
                        <p className="font-semibold bond-amount">
                          {parishData.find((p) => p.parish === selectedParish)?.count ?? 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Bond</span>
                        <p className="font-semibold bond-amount text-terracotta">
                          {formatCurrency(
                            parishData.find((p) => p.parish === selectedParish)?.totalBond ?? 0
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Parish breakdown list */}
              <div className="mt-4 space-y-2">
                {parishData.map((p) => (
                  <div
                    key={p.parish}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedParish(p.parish === selectedParish ? null : p.parish)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-bayou" />
                      <span className="text-sm font-medium">{p.parish}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{p.count} bookings</span>
                      <span className="bond-amount font-semibold text-terracotta">
                        {formatCurrency(p.totalBond)}
                      </span>
                    </div>
                  </div>
                ))}
                {parishData.length === 0 && !statsQuery.isLoading && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data yet. Click "Refresh All Data" to start scraping.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="lg:col-span-2 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-lg">Recent Bookings</CardTitle>
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : stats?.recentBookings && stats.recentBookings.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentBookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border hover:bg-secondary/30 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{booking.name}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {booking.parish}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">{booking.externalBookingId}</span>
                          {booking.bookingTime && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.bookingTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {booking.bondAmount ? (
                          <span className="bond-amount text-base font-bold text-terracotta">
                            {formatCurrency(Number(booking.bondAmount))}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No bond set</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No bookings yet. Click "Refresh All Data" to populate the dashboard.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-secondary/30">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-foreground">LA Bond Alerts</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Bond data from public sheriff inmate rosters</span>
          </div>
          <div className="flex items-center gap-4">
            <span>St. Mary, Allen, Evangeline Parishes</span>
            <span>LA VINE is supplemental only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  accent,
}: {
  title: string;
  value?: string;
  icon: any;
  description: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={`bg-card ${accent ? "border-terracotta/20" : ""}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              accent ? "bg-terracotta/10 text-terracotta" : "bg-bayou/10 text-bayou"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <p className={`bond-amount text-xl md:text-2xl font-bold ${accent ? "text-terracotta" : "text-foreground"}`}>
            {value}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
