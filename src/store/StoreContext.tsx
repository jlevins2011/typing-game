import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { getLesson } from "../data/curriculum";
import { evaluateLesson } from "../lib/engine";
import {
  appendSession,
  createChild,
  emptyStore,
  hashPin,
  loadStore,
  mergeLessonRecord,
  newId,
  saveStore,
} from "../lib/storage";
import type { Coat, Settings, StoreData, View } from "../types";

type Action =
  | { type: "hydrate"; data: StoreData }
  | { type: "go"; view: View }
  | { type: "add-child"; name: string; coat: Coat }
  | { type: "select-child"; id: string }
  | { type: "delete-child"; id: string }
  | { type: "set-pin"; pin: string }
  | { type: "clear-pin" }
  | { type: "settings"; patch: Partial<Settings> }
  | {
      type: "record-session";
      lessonId: string;
      durationMs: number;
      correct: number;
      errors: number;
      keyErrors: Record<string, number>;
      finished: boolean;
    };

type State = StoreData & { view: View };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.data };
    case "go":
      return { ...state, view: action.view };
    case "add-child": {
      const child = createChild(action.name, action.coat);
      return {
        ...state,
        children: [...state.children, child],
        activeChildId: child.id,
        view: { name: "map" },
      };
    }
    case "select-child":
      return { ...state, activeChildId: action.id, view: { name: "map" } };
    case "delete-child": {
      const children = state.children.filter((child) => child.id !== action.id);
      const activeChildId =
        state.activeChildId === action.id ? (children[0]?.id ?? null) : state.activeChildId;
      return { ...state, children, activeChildId };
    }
    case "set-pin":
      return { ...state, parentPin: hashPin(action.pin) };
    case "clear-pin":
      return { ...state, parentPin: null };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "record-session": {
      const childId = state.activeChildId;
      if (!childId) return state;
      const lesson = getLesson(action.lessonId);
      if (!lesson) return state;
      const snapshot = {
        prompt: "x",
        index: action.finished ? 1 : 0,
        startedAt: Date.now() - action.durationMs,
        correct: action.correct,
        errors: action.errors,
        keyErrors: action.keyErrors,
        combo: 0,
        bestCombo: 0,
        lastWasError: false,
        finished: action.finished,
      };
      const result = evaluateLesson(lesson, snapshot, action.durationMs);
      const session = {
        id: newId(),
        childId,
        lessonId: action.lessonId,
        startedAt: Date.now() - action.durationMs,
        durationMs: action.durationMs,
        wpm: result.wpm,
        accuracy: result.accuracy,
        errors: action.errors,
        correct: action.correct,
        charsTyped: action.correct + action.errors,
        keyErrors: action.keyErrors,
        stars: result.stars,
        passed: result.passed,
      };
      return {
        ...state,
        children: state.children.map((child) => {
          if (child.id !== childId) return child;
          const updated = appendSession(child, session);
          if (!result.passed) return updated;
          return {
            ...updated,
            completedLessons: {
              ...updated.completedLessons,
              [action.lessonId]: mergeLessonRecord(updated.completedLessons[action.lessonId], {
                stars: result.stars,
                bestWpm: result.wpm,
                bestAccuracy: result.accuracy,
              }),
            },
          };
        }),
        view: { name: "results", lessonId: action.lessonId, sessionId: session.id },
      };
    }
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...emptyStore(), view: { name: "title" } });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: "hydrate", data: loadStore() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { version, parentPin, children, activeChildId, settings } = state;
    saveStore({ version, parentPin, children, activeChildId, settings });
  }, [state, hydrated]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useActiveChild() {
  const { state } = useStore();
  return state.children.find((child) => child.id === state.activeChildId) ?? null;
}
