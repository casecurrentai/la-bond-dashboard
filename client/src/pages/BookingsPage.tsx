import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  User,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const PARISHES = ["all", "St. Mary", "Allen", "Evangeline"];
const PAGE_SIZE = 25;

export default function BookingsPage() {
  const [parish, setParish] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);

  const queryInput = useMemo(
    () => ({
      parish: parish === "all" ? undefined : parish,
      search: search || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [parish, search, page]
  );

  const { data, isLoading } = trpc.bookings.list.useQuery(queryInput);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
            Booking Records
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all booking records from monitored Louisiana parishes
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} variant="outline" size="sm">
                  Search
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={parish} onValueChange={(v) => { setParish(v); setPage(0); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Parishes" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARISHES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p === "all" ? "All Parishes" : `${p} Parish`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(search || parish !== "all") && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Showing results for:</span>
                {search && (
                  <Badge variant="secondary" className="text-xs">
                    Name: "{search}"
                    <button
                      className="ml-1 hover:text-foreground"
                      onClick={() => { setSearch(""); setSearchInput(""); }}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {parish !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Parish: {parish}
                    <button
                      className="ml-1 hover:text-foreground"
                      onClick={() => setParish("all")}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <span className="ml-auto">
                  {data ? `${data.total} result${data.total !== 1 ? "s" : ""}` : ""}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="bg-card">
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/60 bg-secondary/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Booking ID</div>
              <div className="col-span-2">Parish</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Bond Amount</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {/* Table Body */}
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : data?.items && data.items.length > 0 ? (
              <div className="divide-y divide-border/40">
                {data.items.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    {/* Name */}
                    <div className="md:col-span-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-bayou/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-bayou" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{booking.name}</p>
                        {booking.age && (
                          <p className="text-xs text-muted-foreground">Age: {booking.age}</p>
                        )}
                      </div>
                    </div>

                    {/* Booking ID */}
                    <div className="md:col-span-2 flex items-center">
                      <span className="font-mono text-xs text-muted-foreground">
                        {booking.externalBookingId}
                      </span>
                    </div>

                    {/* Parish */}
                    <div className="md:col-span-2 flex items-center">
                      <Badge variant="outline" className="text-xs font-medium">
                        {booking.parish}
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-2 flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1 shrink-0" />
                      {booking.bookingTime || "N/A"}
                    </div>

                    {/* Bond Amount */}
                    <div className="md:col-span-2 flex items-center justify-end">
                      {booking.bondAmount ? (
                        <span className="bond-amount text-sm font-bold text-terracotta">
                          {formatCurrency(Number(booking.bondAmount))}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No bond</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="md:col-span-1 flex items-center justify-end">
                      <Badge
                        variant={booking.isActive ? "default" : "secondary"}
                        className={`text-[10px] ${
                          booking.isActive
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {booking.isActive ? "Active" : "Released"}
                      </Badge>
                    </div>

                    {/* Charges (mobile-friendly) */}
                    {booking.chargesText && (
                      <div className="md:col-span-12 md:pl-10">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <span className="font-medium text-foreground/70">Charges:</span>{" "}
                          {booking.chargesText}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No bookings found. Try adjusting your filters or refresh data from the dashboard.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages} ({data?.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
