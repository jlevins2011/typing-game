import type { Child, LessonRecord, Session, Settings, StoreData } from "../types";

const KEY = "keytrail.v1";

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  highContrast: false,
  showKeyboard: true,
};

export function emptyStore(): StoreData {
  return {
    version: 1,
    parentPin: null,
    children: [],
    activeChildId: null,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoreData;
    if (parsed.version !== 1 || !Array.isArray(parsed.children)) return emptyStore();
    return {
      ...emptyStore(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(data: StoreData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function hashPin(pin: string): string {
  let h = 5381;
  const salted = `keytrail:${pin}`;
  for (let i = 0; i < salted.length; i++) {
    h = (h * 33) ^ salted.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createChild(name: string, coat: Child["coat"]): Child {
  return {
    id: newId(),
    name: name.trim() || "Explorer",
    coat,
    createdAt: Date.now(),
    completedLessons: {},
    sessions: [],
  };
}

export function mergeLessonRecord(
  current: LessonRecord | undefined,
  next: Pick<LessonRecord, "stars" | "bestWpm" | "bestAccuracy">,
): LessonRecord {
  return {
    stars: Math.max(current?.stars ?? 0, next.stars),
    bestWpm: Math.max(current?.bestWpm ?? 0, next.bestWpm),
    bestAccuracy: Math.max(current?.bestAccuracy ?? 0, next.bestAccuracy),
    attempts: (current?.attempts ?? 0) + 1,
    completedAt: Date.now(),
  };
}

export function appendSession(child: Child, session: Session): Child {
  return {
    ...child,
    sessions: [...child.sessions, session].slice(-200),
  };
}
