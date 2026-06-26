import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Plane, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createThread, deleteThread, useThreads } from "@/lib/threads";

export function ThreadSidebar() {
  const threads = useThreads();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const onNew = () => {
    const t = createThread();
    navigate({ to: "/c/$threadId", params: { threadId: t.id } });
  };

  const onDelete = (id: string) => {
    deleteThread(id);
    if (id === activeId) {
      const remaining = useThreadsSnapshotForRedirect();
      const next = remaining.find((t) => t.id !== id);
      if (next) {
        navigate({ to: "/c/$threadId", params: { threadId: next.id }, replace: true });
      } else {
        const fresh = createThread();
        navigate({ to: "/c/$threadId", params: { threadId: fresh.id }, replace: true });
      }
    }
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Plane className="h-4 w-4" />
        </div>
        <div className="font-semibold">Travel Copilot</div>
      </div>
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2" variant="default">
          <MessageSquarePlus className="h-4 w-4" /> New conversation
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <ul className="space-y-1 pb-4">
          {threads.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              No conversations yet
            </li>
          )}
          {threads.map((t) => (
            <li key={t.id} className="group flex items-center gap-1">
              <Link
                to="/c/$threadId"
                params={{ threadId: t.id }}
                className={cn(
                  "flex-1 truncate rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  activeId === t.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                {t.title || "Untitled"}
              </Link>
              <button
                type="button"
                aria-label="Delete conversation"
                onClick={() => onDelete(t.id)}
                className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <div className="border-t px-4 py-3 text-[10px] text-muted-foreground">
        Backend: <code>{import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}</code>
      </div>
    </aside>
  );
}

// Read current threads outside a render — used only at click time.
function useThreadsSnapshotForRedirect() {
  try {
    const raw = localStorage.getItem("travel-copilot.threads.v1");
    return raw ? (JSON.parse(raw) as { id: string }[]) : [];
  } catch {
    return [];
  }
}