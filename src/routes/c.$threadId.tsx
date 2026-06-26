import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import { ChatWindow } from "@/components/chat-window";
import { ThreadSidebar } from "@/components/thread-sidebar";
import { createThread, useHydrated, useThread } from "@/lib/threads";

export const Route = createFileRoute("/c/$threadId")({
  head: () => ({
    meta: [
      { title: `Chat • Travel Copilot` },
      { name: "description", content: "AI Travel Copilot conversation." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: `Travel Copilot` },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const hydrated = useHydrated();
  const thread = useThread(threadId);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated || thread) return;
    // Unknown thread id (e.g. opened a stale URL) — create one and redirect.
    const t = createThread();
    navigate({ to: "/c/$threadId", params: { threadId: t.id }, replace: true });
  }, [hydrated, thread, navigate]);

  if (!hydrated || !thread) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <ThreadSidebar />
      <ChatWindow key={thread.id} thread={thread} />
      <Toaster position="top-right" richColors />
    </div>
  );
}