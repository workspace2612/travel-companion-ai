import type { ToolCall } from "@/lib/api";
import { FlightCards } from "./flight-cards";
import { FlexDateCards } from "./flex-date-cards";
import { DestinationCards } from "./destination-cards";
import { HotelCards } from "./hotel-cards";
import { BudgetOptimizerCard } from "./budget-optimizer";
import { ItineraryAnalysisCard } from "./itinerary-analysis";

export function ToolResult({ call }: { call: ToolCall }) {
  const { name, result } = call;
  const r = result as Record<string, unknown> | null | undefined;

  const card = (() => {
    if (!r || typeof r !== "object") return null;
    switch (name) {
      case "search_flights":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <FlightCards data={r as any} />;
      case "search_flights_flex":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <FlexDateCards data={r as any} />;
      case "discover_destinations":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <DestinationCards data={r as any} />;
      case "search_hotels":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <HotelCards data={r as any} />;
      case "optimize_budget":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <BudgetOptimizerCard data={r as any} />;
      case "analyze_itinerary":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <ItineraryAnalysisCard data={r as any} />;
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {name.replace(/_/g, " ")}
      </div>
      {card ?? (
        <details className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Raw result</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-[11px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
