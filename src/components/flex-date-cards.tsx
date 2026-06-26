import { CalendarDays, TrendingDown, Plane } from "lucide-react";

interface MatrixEntry {
  date: string;
  return_date?: string | null;
  price?: number | null;
  currency?: string;
  airline?: string;
  duration_min?: number;
  stops?: number;
  error?: string;
}

interface FlexSearchResult {
  requested_date?: string;
  flex_days?: number;
  matrix?: MatrixEntry[];
  cheapest?: MatrixEntry | null;
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

function fmtDay(iso: string) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export function FlexDateCards({ data }: { data: FlexSearchResult }) {
  if (data.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Flexible search failed: {data.error}
      </div>
    );
  }

  const matrix = (data.matrix ?? []).filter((m) => !m.error);
  const priced = matrix.filter((m) => typeof m.price === "number");
  if (priced.length === 0) {
    return (
      <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        No flights found across the flexible date range.
      </div>
    );
  }

  const prices = priced.map((m) => m.price as number);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(max - min, 1);
  const currency = priced[0].currency ?? "INR";
  const cheapestDate = data.cheapest?.date;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4 text-primary" />
        Cheapest days to fly
        {data.flex_days != null && (
          <span className="text-xs font-normal text-muted-foreground">
            (±{data.flex_days} days)
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {matrix.map((m, i) => {
          const has = typeof m.price === "number";
          const price = has ? (m.price as number) : 0;
          const isCheapest = m.date === cheapestDate;
          const pct = has ? 8 + ((price - min) / span) * 92 : 0;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-24 shrink-0 font-medium">{fmtDay(m.date)}</div>
              <div className="flex h-6 flex-1 items-center rounded bg-muted/50">
                {has ? (
                  <div
                    className={`flex h-full items-center justify-end rounded px-2 text-[10px] font-semibold ${
                      isCheapest
                        ? "bg-green-500/25 text-green-700 dark:text-green-300"
                        : "bg-primary/15 text-foreground"
                    }`}
                    style={{ width: `${pct}%` }}
                  >
                    {currency} {price.toLocaleString()}
                  </div>
                ) : (
                  <span className="px-2 text-[10px] text-muted-foreground">No flights</span>
                )}
              </div>
              {isCheapest && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                  <TrendingDown className="h-3 w-3" />
                  Best
                </span>
              )}
            </div>
          );
        })}
      </div>

      {data.cheapest && (
        <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-2 text-xs">
          <Plane className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span>
            Cheapest on <strong>{fmtDay(data.cheapest.date)}</strong>
            {data.cheapest.return_date && <> → {fmtDay(data.cheapest.return_date)}</>} at{" "}
            <strong>
              {currency} {(data.cheapest.price as number).toLocaleString()}
            </strong>
            {data.cheapest.airline && (
              <> on {AIRLINE_NAMES[data.cheapest.airline] || data.cheapest.airline}</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
