import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface ScoreObj {
  budget_efficiency?: number;
  comfort?: number;
  exploration?: number;
  value_for_money?: number;
}

interface PaceDay {
  day: number;
  load?: string;
  fatigue_risk?: string;
  notes?: string;
}

interface ItineraryAnalysis {
  summary?: string;
  destinations?: string[];
  duration_days?: number;
  estimated_cost_breakdown?: Record<string, string>;
  pace_analysis?: PaceDay[];
  optimizations?: string[];
  pros?: string[];
  cons?: string[];
  experience_score?: ScoreObj;
  alternative_savings?: string;
  error?: string;
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function ItineraryAnalysisCard({ data }: { data: ItineraryAnalysis }) {
  if (data.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        {data.error}
      </div>
    );
  }
  const score = data.experience_score || {};
  const cost = data.estimated_cost_breakdown || {};
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
      {data.summary && (
        <p className="leading-relaxed">{data.summary}</p>
      )}
      {data.destinations && data.destinations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.destinations.map((d) => (
            <span key={d} className="rounded-full bg-accent px-2 py-0.5 text-[11px]">{d}</span>
          ))}
        </div>
      )}

      {Object.keys(cost).length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Estimated cost</div>
          <div className="mt-1 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
            {Object.entries(cost).map(([k, v]) => (
              <div key={k} className="rounded border bg-background px-2 py-1">
                <div className="text-[10px] uppercase text-muted-foreground">{k.replace(/_/g, " ")}</div>
                <div className="font-medium">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(score).length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <ScoreBar label="Budget efficiency" value={score.budget_efficiency} />
          <ScoreBar label="Comfort" value={score.comfort} />
          <ScoreBar label="Exploration" value={score.exploration} />
          <ScoreBar label="Value for money" value={score.value_for_money} />
        </div>
      )}

      {data.pace_analysis && data.pace_analysis.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Day-by-day pace</div>
          <ul className="mt-1 space-y-1 text-xs">
            {data.pace_analysis.map((p) => (
              <li key={p.day} className="rounded border bg-background px-2 py-1">
                <span className="font-medium">Day {p.day}</span>
                {p.load && <span className="ml-2 text-muted-foreground">{p.load}</span>}
                {p.fatigue_risk && (
                  <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                    fatigue: {p.fatigue_risk}
                  </span>
                )}
                {p.notes && <div className="mt-0.5 text-muted-foreground">{p.notes}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {data.pros && data.pros.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Pros
            </div>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              {data.pros.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        {data.cons && data.cons.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Cons
            </div>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              {data.cons.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
      </div>

      {data.optimizations && data.optimizations.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Optimizations
          </div>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
            {data.optimizations.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {data.alternative_savings && (
        <div className="rounded border border-green-500/30 bg-green-500/5 p-2 text-xs">
          <span className="font-semibold">Savings idea: </span>{data.alternative_savings}
        </div>
      )}
    </div>
  );
}
