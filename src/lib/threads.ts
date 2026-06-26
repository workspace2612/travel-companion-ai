// localStorage-backed thread store for AI Travel Copilot
import { useEffect, useState, useSyncExternalStore } from "react";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  toolCalls?: { name: string; args: unknown; result: unknown }[];
}

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const KEY = "travel-copilot.threads.v1";

function read(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Thread[]) : [];
  } catch {
    return [];
  }
}

function write(threads: Thread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(threads));
  listeners.forEach((l) => l());
}

const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useThreads(): Thread[] {
  return useSyncExternalStore(subscribe, read, () => []);
}

export function useThread(id: string | undefined): Thread | null {
  const threads = useThreads();
  return threads.find((t) => t.id === id) ?? null;
}

export function createThread(title = "New conversation"): Thread {
  const id = crypto.randomUUID();
  const now = Date.now();
  const t: Thread = { id, title, createdAt: now, updatedAt: now, messages: [] };
  write([t, ...read()]);
  return t;
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
}

export function renameThread(id: string, title: string) {
  write(read().map((t) => (t.id === id ? { ...t, title } : t)));
}

export function appendMessage(threadId: string, msg: ChatMessage) {
  const threads = read();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx === -1) return;
  const t = threads[idx];
  const updated: Thread = {
    ...t,
    messages: [...t.messages, msg],
    updatedAt: Date.now(),
    title:
      t.messages.length === 0 && msg.role === "user"
        ? msg.content.slice(0, 60)
        : t.title,
  };
  threads[idx] = updated;
  write(threads);
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}