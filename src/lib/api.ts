const BASE = "";

export interface BackendChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCall {
  name: string;
  args: unknown;
  result: unknown;
}

export interface BackendChatResponse {
  reply: string;
  tool_calls?: ToolCall[];
}

export async function postChat(
  messages: BackendChatMessage[],
  threadId: string,
): Promise<BackendChatResponse> {
  const r = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, thread_id: threadId }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Backend ${r.status}: ${text || r.statusText}`);
  }
  return (await r.json()) as BackendChatResponse;
}

export async function analyzeItineraryPdf(_file: File): Promise<unknown> {
  throw new Error(
    "PDF upload isn't wired up yet on this deployment. Paste an itinerary URL or text into chat instead and I'll analyze it.",
  );
}

export async function analyzeItineraryUrl(url: string): Promise<unknown> {
  const res = await postChat(
    [{ role: "user", content: `Analyze this itinerary URL: ${url}` }],
    "url-analyze",
  );
  const call = res.tool_calls?.find((c) => c.name === "analyze_itinerary");
  return call?.result ?? { reply: res.reply };
}

export const backendUrl = BASE;

