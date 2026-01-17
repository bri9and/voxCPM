import { HistoryItem } from "./types";

const STORAGE_KEY = "voxcpm-history";
const MAX_HISTORY_ITEMS = 20;

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addToHistory(item: HistoryItem): HistoryItem[] {
  const history = getHistory();
  const updated = [item, ...history].slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage quota exceeded - remove oldest items
    const reduced = updated.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
  }
  return updated;
}

export function removeFromHistory(id: string): HistoryItem[] {
  const history = getHistory();
  const updated = history.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
