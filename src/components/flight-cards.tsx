import { Plane, Clock, ArrowRight } from "lucide-react";

interface FlightResult {
  airline: string;
  price: number;
  currency: string;
  duration_min: number;
  stops: number;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  score: number;
}

interface FlightSearchResult {
  results?: FlightResult[];
  cheapest_price?: number;
  error?: string;
}

const AIRLINE_NAMES: Record<string, string> = {
  "6E": "IndiGo",
  AI: "Air India",
  UK: "Vistara",
  SG: "SpiceJet",
  EK: "Emirates",
  QR: "Qatar Airways",
  SQ: "Singapore Airlines",
  LH: "Lufthansa",
  BA: "British Airways",
  AF: "Air France",
};

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function FlightCards({ data }: { data: FlightSearchResult }) {
  if (data.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Flight search failed: {data.error}
      </div>
    );
  }
  const results = data.results ?? [];
  if (results.length === 0) {
    return (
      <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        No flights found for those criteria.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {results.slice(0, 6).map((f, i) => {
        const isCheapest = data.cheapest_price && f.price === data.cheapest_price;
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-primary"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Plane className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                {AIRLINE_NAMES[f.airline] || f.airline}
                {isCheapest && (
                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                    Cheapest
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{f.departure.iataCode} {fmtTime(f.departure.at)}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{f.arrival.iataCode} {fmtTime(f.arrival.at)}</span>
                <span className="mx-1">·</span>
                <Clock className="h-3 w-3" />
                <span>{fmtDuration(f.duration_min)}</span>
                <span className="mx-1">·</span>
                <span>{f.stops === 0 ? "Non-stop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">
                {f.currency} {f.price.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">score {f.score}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
