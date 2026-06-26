import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { createThread, useThreads, useHydrated } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Travel Copilot" },
      {
        name: "description",
        content:
          "Conversational travel planner: discover destinations, search flights, analyze itineraries, and generate personalized trips.",
      },
      { property: "og:title", content: "AI Travel Copilot" },
      {
        property: "og:description",
        content: "One AI assistant for destinations, flights, and full trip plans.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const hydrated = useHydrated();
  const threads = useThreads();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    const target = threads[0] ?? createThread();
    navigate({ to: "/c/$threadId", params: { threadId: target.id }, replace: true });
  }, [hydrated, threads, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
      Loading Travel Copilot…
    </div>
  );
}
