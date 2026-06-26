import { Wallet, TrendingDown, Sparkles, Gem } from "lucide-react";

interface Allocation {
  category: string;
  amount: number;
  percent: number;
  note?: string;
}

interface BudgetResult {
  destination?: string;
  total_budget: number;
  currency: string;
  per_day?: number;
  feasibility?: "tight" | "comfortable" | "generous" | string;
  feasibility_note?: string;
  allocations?: Allocation[];
  savings_tips?: string[];
  splurge_worthy?: string[];
  error?: string;
}

const FEASIBILITY_STYLES: Record<string, string> = {
  tight: "bg-red-500/15 text-red-700 dark:text-red-400",
  comfortable: "bg-green-500/15 text-green-700 dark:text-green-400",
  generous: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const BAR_COLORS = [
  "bg-primary",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
];

export function BudgetOptimizerCard({ data }: { data: BudgetResult }) {
  if (data.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Budget optimization failed: {data.error}
      </div>
    );
  }

  const allocations = data.allocations ?? [];
  const currency = data.currency || "INR";
  const feasKey = (data.feasibility || "").toLowerCase();

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Wallet className="h-4 w-4 text-primary" />
        Budget plan
        {data.destination && <span className="text-muted-foreground">· {data.destination}</span>}
        {feasKey && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
              FEASIBILITY_STYLES[feasKey] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {feasKey}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-3">
        <div className="text-lg font-semibold">
          {currency} {data.total_budget.toLocaleString()}
        </div>
        {data.per_day != null && (
          <div className="text-xs text-muted-foreground">
            ≈ {currency} {Math.round(data.per_day).toLocaleString()} / day
          </div>
        )}
      </div>

      {data.feasibility_note && (
        <p className="text-xs text-muted-foreground">{data.feasibility_note}</p>
      )}

      <div className="space-y-2">
        {allocations.map((a, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{a.category}</span>
              <span className="text-muted-foreground">
                {currency} {a.amount.toLocaleString()} · {Math.round(a.percent)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.min(Math.max(a.percent, 2), 100)}%` }}
              />
            </div>
            {a.note && <p className="text-[10px] text-muted-foreground">{a.note}</p>}
          </div>
        ))}
      </div>

      {!!data.savings_tips?.length && (
        <div className="rounded-md bg-green-500/10 p-2">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
            <TrendingDown className="h-3.5 w-3.5" /> Ways to save
          </div>
          <ul className="space-y-0.5 text-[11px] text-muted-foreground">
            {data.savings_tips.map((t, i) => (
              <li key={i} className="flex gap-1.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!data.splurge_worthy?.length && (
        <div className="rounded-md bg-amber-500/10 p-2">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Gem className="h-3.5 w-3.5" /> Worth the splurge
          </div>
          <ul className="space-y-0.5 text-[11px] text-muted-foreground">
            {data.splurge_worthy.map((t, i) => (
              <li key={i}>· {t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
