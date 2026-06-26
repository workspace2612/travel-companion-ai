import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Paperclip, SendHorizontal, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { analyzeItineraryPdf, postChat } from "@/lib/api";
import { appendMessage, type Thread } from "@/lib/threads";
import { ToolResult } from "./tool-result";

const SUGGESTIONS = [
  "I have ₹60,000 and 5 days from Delhi — suggest destinations",
  "Find the cheapest flight DEL to DPS on 2026-10-12",
  "Analyze https://www.30sundays.club/itineraries/switzerland-7-days",
  "Plan a 7-day nature + luxury trip from Mumbai, budget ₹1.5L",
];

export function ChatWindow({ thread }: { thread: Thread }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [thread.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    appendMessage(thread.id, {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    });
    setLoading(true);
    try {
      const history = [
        ...thread.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ];
      const res = await postChat(history, thread.id);
      appendMessage(thread.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.reply || "(no reply)",
        createdAt: Date.now(),
        toolCalls: res.tool_calls,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toast.error(msg);
      appendMessage(thread.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `**Error:** ${msg}`,
        createdAt: Date.now(),
      });
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || loading) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    appendMessage(thread.id, {
      id: crypto.randomUUID(),
      role: "user",
      content: `📎 Uploaded itinerary PDF: **${file.name}**`,
      createdAt: Date.now(),
    });
    setLoading(true);
    try {
      const result = await analyzeItineraryPdf(file);
      appendMessage(thread.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Here's the analysis of **${file.name}**:`,
        createdAt: Date.now(),
        toolCalls: [{ name: "analyze_itinerary", args: { filename: file.name }, result }],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
      appendMessage(thread.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `**PDF analysis failed:** ${msg}`,
        createdAt: Date.now(),
      });
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <div className="flex h-screen flex-1 flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {thread.messages.length === 0 ? (
            <EmptyState onPick={send} onUpload={onPickFile} />
          ) : (
            <ul className="space-y-6">
              {thread.messages.map((m) => (
                <li key={m.id} className="flex gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      m.role === "user"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {m.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="space-y-3">
                        {m.toolCalls.map((c, i) => (
                          <ToolResult key={i} call={c} />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {loading && (
                <li className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                  </div>
                </li>
              )}
              <div ref={bottomRef} />
            </ul>
          )}
        </div>
      </div>

      <div className="border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3"
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={onPickFile}
            disabled={loading}
            title="Upload itinerary PDF"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about destinations, flights, or paste an itinerary URL…"
            rows={1}
            className="min-h-[44px] resize-none"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-3">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  onUpload,
}: {
  onPick: (text: string) => void;
  onUpload: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Where to next?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Discover destinations, search flights, analyze itineraries, or plan a full trip — all in one chat.
      </p>
      <div className="mt-8 grid gap-2 text-left sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-lg border bg-card px-3 py-3 text-sm transition hover:border-primary hover:bg-accent"
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={onUpload}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-card px-3 py-3 text-sm transition hover:border-primary hover:bg-accent sm:col-span-2"
        >
          <Paperclip className="h-4 w-4" />
          Upload an itinerary PDF to analyze
        </button>
      </div>
    </div>
  );
}
