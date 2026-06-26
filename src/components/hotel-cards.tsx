import { Hotel, Star, MapPin, BadgeIndianRupee, Sparkles } from "lucide-react";

interface AmadeusHotel {
  name: string;
  hotel_id?: string;
  rating?: number | string | null;
  price_total: number;
  currency: string;
  check_in?: string;
  check_out?: string;
  room?: string | null;
  board?: string | null;
}

interface AiHotel {
  name: string;
  area?: string;
  rating?: number;
  price_per_night: number;
  currency?: string;
  why?: string;
  amenities?: string[];
}

interface HotelSearchResult {
  source?: "amadeus" | "ai_estimate";
  city_code?: string;
  check_in?: string;
  check_out?: string;
  results?: AmadeusHotel[];
  hotels?: AiHotel[];
  cheapest_total?: number;
  error?: string;
}

function Rating({ value }: { value?: number | string | null }) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (!n || Number.isNaN(n)) return null;
  return (
    <span className="flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400">
      <Star className="h-3 w-3 fill-current" />
      {n}
    </span>
  );
}

export function HotelCards({ data }: { data: HotelSearchResult }) {
  if (data.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Hotel search failed: {data.error}
      </div>
    );
  }

  const isAi = data.source === "ai_estimate" || (!data.results?.length && !!data.hotels?.length);
  const live = data.results ?? [];
  const ai = data.hotels ?? [];

  if (live.length === 0 && ai.length === 0) {
    return (
      <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        No hotels found for this city and dates.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Hotel className="h-4 w-4 text-primary" />
        Hotels {data.city_code && <span className="text-muted-foreground">· {data.city_code}</span>}
        {isAi && (
          <span className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <Sparkles className="h-3 w-3" /> AI estimate
          </span>
        )}
      </div>

      <div className="space-y-2">
        {live.map((h, i) => (
          <div key={h.hotel_id ?? i} className="rounded-md border bg-background p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{h.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Rating value={h.rating} />
                  {h.room && <span>{h.room.replace(/_/g, " ").toLowerCase()}</span>}
                  {h.board && <span>· {h.board.toLowerCase()}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold">
                  {h.currency} {h.price_total.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">total stay</div>
              </div>
            </div>
          </div>
        ))}

        {ai.map((h, i) => (
          <div key={i} className="rounded-md border bg-background p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{h.name}</div>
                {h.area && (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {h.area}
                    <Rating value={h.rating} />
                  </div>
                )}
                {h.why && <p className="mt-1 text-[11px] text-muted-foreground">{h.why}</p>}
                {!!h.amenities?.length && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {h.amenities.slice(0, 5).map((a, j) => (
                      <span key={j} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end text-sm font-semibold">
                  <BadgeIndianRupee className="mr-0.5 h-3.5 w-3.5" />
                  {h.price_per_night.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">/ night</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
