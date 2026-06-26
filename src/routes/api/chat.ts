import { createFileRoute } from "@tanstack/react-router";
import {
  generateText,
  tool,
  stepCountIs,
  type ModelMessage,
  type ToolSet,
} from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are AI Travel Copilot — a friendly, expert travel planner.
You have tools for destination discovery, budget optimization, itinerary analysis, and full trip generation.
Use a tool whenever the user's request maps to one; otherwise answer conversationally.
After a tool returns, summarize the result for the user in a clear, well-formatted markdown reply.
Currency defaults to INR; origin defaults to the user's city if they mention one.
Ask brief follow-ups when key inputs are missing.
Flight search, hotel search, and PDF/URL scraping are temporarily unavailable — tell the user politely if they ask.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ToolCallRecord {
  name: string;
  args: unknown;
  result: unknown;
}

const NOT_CONFIGURED = {
  error: "This tool is not configured yet on this deployment.",
};

function makeTools(model: ReturnType<ReturnType<typeof createLovableAiGatewayProvider>>, log: ToolCallRecord[]): ToolSet {
  // Helper: ask the LLM for a JSON object given a prompt
  const askJson = async (prompt: string): Promise<unknown> => {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a travel planning data generator. Respond ONLY with a single valid JSON object. No prose, no markdown, no code fences.",
        },
        { role: "user", content: prompt },
      ],
    });
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Try to extract the first {...} block
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {
          /* fall through */
        }
      }
      return { error: "Could not parse model JSON", raw: cleaned.slice(0, 500) };
    }
  };

  const record = (name: string, args: unknown, result: unknown) => {
    log.push({ name, args, result });
    return result;
  };

  return {
    discover_destinations: tool({
      description:
        "Suggest destinations matching interests, budget, duration and origin. Returns a list of destination ideas with rationale.",
      inputSchema: z.object({
        origin: z.string(),
        budget_inr: z.number(),
        duration_days: z.number().int(),
        interests: z.array(z.string()).default([]),
        count: z.number().int().default(5),
      }),
      execute: async (args) => {
        const result = await askJson(
          `Suggest ${args.count} destinations for a traveler from ${args.origin} with a budget of ₹${args.budget_inr} INR for ${args.duration_days} days. Interests: ${(args.interests ?? []).join(", ") || "general"}.
Return JSON of shape:
{"destinations":[{"name":string,"country":string,"why":string,"best_for":string[],"est_total_inr":number,"highlights":string[]}]}`,
        );
        return record("discover_destinations", args, result);
      },
    }),

    optimize_budget: tool({
      description:
        "Allocate a total trip budget across flights, accommodation, food, activities, local transport and misc, with feasibility analysis and savings tips.",
      inputSchema: z.object({
        destination: z.string(),
        total_budget: z.number(),
        duration_days: z.number().int(),
        travelers: z.number().int().default(1),
        interests: z.array(z.string()).default([]),
        currency: z.string().default("INR"),
      }),
      execute: async (args) => {
        const result = await askJson(
          `Optimize a budget for ${args.travelers} traveler(s) going to ${args.destination} for ${args.duration_days} days with a total budget of ${args.total_budget} ${args.currency}. Interests: ${args.interests.join(", ") || "general"}.
Return JSON of shape:
{"destination":string,"total_budget":number,"currency":string,"allocation":{"flights":number,"accommodation":number,"food":number,"activities":number,"local_transport":number,"misc":number},"feasibility":"comfortable"|"tight"|"unrealistic","notes":string,"savings_tips":string[]}`,
        );
        return record("optimize_budget", args, result);
      },
    }),

    generate_trip: tool({
      description: "Generate a complete day-by-day trip plan with activities, meals, and budget breakdown.",
      inputSchema: z.object({
        origin: z.string(),
        destination: z.string().optional(),
        budget_inr: z.number(),
        duration_days: z.number().int(),
        interests: z.array(z.string()).default([]),
      }),
      execute: async (args) => {
        const result = await askJson(
          `Generate a ${args.duration_days}-day trip plan from ${args.origin}${args.destination ? ` to ${args.destination}` : ""} with budget ₹${args.budget_inr} INR. Interests: ${args.interests.join(", ") || "general"}.
Return JSON of shape:
{"origin":string,"destination":string,"duration_days":number,"budget_inr":number,"summary":string,"days":[{"day":number,"title":string,"morning":string,"afternoon":string,"evening":string,"meals":string[],"est_cost_inr":number}],"total_est_inr":number,"tips":string[]}`,
        );
        return record("generate_trip", args, result);
      },
    }),

    analyze_itinerary: tool({
      description: "Analyze an itinerary from a URL or pasted text. Returns a structured breakdown.",
      inputSchema: z.object({
        url: z.string().optional(),
        text: z.string().optional(),
      }),
      execute: async (args) => {
        let source = args.text ?? "";
        if (!source && args.url) {
          try {
            const r = await fetch(args.url, {
              headers: { "User-Agent": "Mozilla/5.0 TripPlannerBot" },
            });
            const html = await r.text();
            // Strip tags, collapse whitespace, cap length
            source = html
              .replace(/<script[\s\S]*?<\/script>/gi, " ")
              .replace(/<style[\s\S]*?<\/style>/gi, " ")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 12000);
          } catch (e) {
            const result = {
              error: `Could not fetch URL: ${e instanceof Error ? e.message : String(e)}`,
            };
            return record("analyze_itinerary", args, result);
          }
        }
        if (!source) {
          const result = { error: "Provide either `url` or `text`." };
          return record("analyze_itinerary", args, result);
        }
        const result = await askJson(
          `Analyze this travel itinerary and extract a structured plan.
Itinerary source:
"""
${source}
"""
Return JSON of shape:
{"title":string,"destination":string,"duration_days":number,"days":[{"day":number,"title":string,"activities":string[],"meals":string[],"stay":string}],"highlights":string[],"estimated_budget_inr":number|null,"notes":string}`,
        );
        return record("analyze_itinerary", args, result);
      },
    }),

    search_flights: tool({
      description: "Search real flights between two IATA airports on a given date.",
      inputSchema: z.object({
        origin_iata: z.string(),
        destination_iata: z.string(),
        date: z.string(),
      }),
      execute: async (args) => record("search_flights", args, NOT_CONFIGURED),
    }),

    search_flights_flex: tool({
      description: "Find the cheapest day to fly within a flex window around a target date.",
      inputSchema: z.object({
        origin_iata: z.string(),
        destination_iata: z.string(),
        date: z.string(),
        flex_days: z.number().int().default(3),
      }),
      execute: async (args) => record("search_flights_flex", args, NOT_CONFIGURED),
    }),

    search_hotels: tool({
      description: "Search hotels for an IATA city code between check-in and check-out.",
      inputSchema: z.object({
        city_code: z.string(),
        check_in: z.string(),
        check_out: z.string(),
      }),
      execute: async (args) => record("search_hotels", args, NOT_CONFIGURED),
    }),
  };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ reply: "Server missing LOVABLE_API_KEY.", tool_calls: [] }, { status: 500 });
        }

        let body: { messages?: ChatMessage[] };
        try {
          body = (await request.json()) as { messages?: ChatMessage[] };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];

        const provider = createLovableAiGatewayProvider(key);
        const model = provider("google/gemini-3-flash-preview");

        const toolLog: ToolCallRecord[] = [];
        const tools = makeTools(model, toolLog);

        const modelMessages: ModelMessage[] = [
          { role: "system", content: SYSTEM },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];

        try {
          const result = await generateText({
            model,
            tools,
            messages: modelMessages,
            stopWhen: stepCountIs(50),
          });
          return Response.json({ reply: result.text || "", tool_calls: toolLog });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          // Surface gateway errors clearly
          const status = /\b429\b/.test(msg) ? 429 : /\b402\b/.test(msg) ? 402 : 500;
          return Response.json({ reply: `AI error: ${msg}`, tool_calls: toolLog }, { status });
        }
      },
    },
  },
});
