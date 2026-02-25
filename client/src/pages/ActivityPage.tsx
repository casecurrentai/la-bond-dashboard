import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  RefreshCw,
  Zap,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ActivityPage() {
  const logsQuery = trpc.logs.recent.useQuery({ limit: 50 });
  const bondChangesQuery = trpc.bonds.recentChanges.useQuery({ limit: 20 });
  const sourcesQuery = trpc.sources.list.useQuery();

  const scrapeAll = trpc.scrape.all.useMutation({
    onSuccess: (results) => {
      const total = results.reduce((s, r) => s + r.recordCount, 0);
      toast.success(`Scraped ${total} bookings from ${results.length} parishes`);
      logsQuery.refetch();
      bondChangesQuery.refetch();
      sourcesQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Scrape failed: ${err.message}`);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              Activity Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor scrape activity, bond changes, and data source health
            </p>
          </div>
          <Button
            onClick={() => scrapeAll.mutate()}
            disabled={scrapeAll.isPending}
            className="bg-bayou hover:bg-bayou-light text-cream gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${scrapeAll.isPending ? "animate-spin" : ""}`} />
            {scrapeAll.isPending ? "Scraping..." : "Refresh Now"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Source Status */}
          <Card className="lg:col-span-1 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 text-bayou" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sourcesQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              ) : sourcesQuery.data && sourcesQuery.data.length > 0 ? (
                sourcesQuery.data.map((source: any) => (
                  <div
                    key={source.id}
                    className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{source.parish} Parish</span>
                      {source.lastError ? (
                        <Badge variant="destructive" className="text-[10px]">
                          <XCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      ) : source.lastSuccessAt ? (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Healthy
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider mb-0.5">
                          Records
                        </span>
                        <span className="font-semibold text-foreground bond-amount">
                          {source.recordCount}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider mb-0.5">
                          Last Poll
                        </span>
                        <span className="text-foreground">
                          {source.lastPolledAt ? formatDate(source.lastPolledAt) : "Never"}
                        </span>
                      </div>
                    </div>
                    {source.lastError && (
                      <p className="mt-2 text-xs text-destructive truncate">{source.lastError}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No sources configured yet. Run a scrape to initialize.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Scrape Logs + Bond Changes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bond Changes */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-terracotta" />
                  Bond Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bondChangesQuery.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : bondChangesQuery.data && bondChangesQuery.data.length > 0 ? (
                  <div className="space-y-2">
                    {bondChangesQuery.data.map((change: any) => (
                      <div
                        key={change.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {change.bookingName || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="text-[10px]">
                              {change.parish}
                            </Badge>
                            <span>{formatDate(change.changedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bond-amount text-muted-foreground line-through">
                            {change.previousAmount
                              ? formatCurrency(Number(change.previousAmount))
                              : "$0"}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="bond-amount font-bold text-terracotta">
                            {change.newAmount
                              ? formatCurrency(Number(change.newAmount))
                              : "$0"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No bond changes detected yet. Changes appear when bond amounts are updated between scrapes.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Scrape Logs */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Timer className="w-4 h-4 text-bayou" />
                  Scrape History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logsQuery.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : logsQuery.data && logsQuery.data.length > 0 ? (
                  <div className="space-y-1">
                    {logsQuery.data.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                          )}
                          <div>
                            <span className="text-sm font-medium">{log.parish}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(log.scrapedAt)}</span>
                              {log.durationMs && (
                                <>
                                  <Separator orientation="vertical" className="h-3" />
                                  <span>{(log.durationMs / 1000).toFixed(1)}s</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">
                            {log.recordCount} records
                          </span>
                          {log.newBookings > 0 && (
                            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                              +{log.newBookings} new
                            </Badge>
                          )}
                          {log.bondChanges > 0 && (
                            <Badge className="text-[10px] bg-terracotta/10 text-terracotta border-terracotta/20">
                              {log.bondChanges} bond changes
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No scrape history yet. Click "Refresh Now" to start.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
