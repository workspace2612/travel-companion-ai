import { MapPin, Calendar, Wallet } from "lucide-react";

interface Destination {
  name: string;
  country?: string;
  estimated_cost: string;
  best_season: string;
  key_attractions?: string[];
  why: string;
}

export function DestinationCards({ data }: { data: { destinations?: Destination[] } }) {
  const items = data.destinations ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        No destinations returned.
      </div>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((d, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 text-sm">
          <div className="flex items-center gap-1.5 font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            {d.name}
            {d.country && <span className="text-xs font-normal text-muted-foreground">· {d.country}</span>}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{d.why}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {d.estimated_cost}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {d.best_season}</span>
          </div>
          {d.key_attractions && d.key_attractions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {d.key_attractions.slice(0, 4).map((a) => (
                <span key={a} className="rounded-full bg-accent px-2 py-0.5 text-[10px]">{a}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
