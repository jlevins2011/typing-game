import type { Lesson, TypingSnapshot } from "../types";
import { computeAccuracy, computeWpm, starsForAttempt } from "./wpm";

const IGNORED = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "Tab",
  "CapsLock",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "Delete",
  "Backspace",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "Dead",
]);

export function createSnapshot(prompt: string): TypingSnapshot {
  return {
    prompt,
    index: 0,
    startedAt: null,
    correct: 0,
    errors: 0,
    keyErrors: {},
    combo: 0,
    bestCombo: 0,
    lastWasError: false,
    finished: prompt.length === 0,
  };
}

export function isTypingKey(key: string): boolean {
  if (IGNORED.has(key)) return false;
  if (key === "Enter") return false;
  return key.length === 1;
}

function matches(expected: string, got: string, lenientCase: boolean): boolean {
  if (got === expected) return true;
  if (lenientCase && got.toLowerCase() === expected.toLowerCase()) return true;
  return false;
}

export function applyKey(
  snapshot: TypingSnapshot,
  key: string,
  now: number,
  lenientCase: boolean,
): TypingSnapshot {
  if (snapshot.finished) return snapshot;
  if (!isTypingKey(key)) return snapshot;

  const expected = snapshot.prompt[snapshot.index] ?? "";
  const startedAt = snapshot.startedAt ?? now;
  const ok = matches(expected, key, lenientCase);

  if (ok) {
    const index = snapshot.index + 1;
    const combo = snapshot.combo + 1;
    return {
      ...snapshot,
      startedAt,
      index,
      correct: snapshot.correct + 1,
      combo,
      bestCombo: Math.max(snapshot.bestCombo, combo),
      lastWasError: false,
      finished: index >= snapshot.prompt.length,
    };
  }

  const expectedKey = expected || " ";
  return {
    ...snapshot,
    startedAt,
    errors: snapshot.errors + 1,
    combo: 0,
    lastWasError: true,
    keyErrors: {
      ...snapshot.keyErrors,
      [expectedKey]: (snapshot.keyErrors[expectedKey] ?? 0) + 1,
    },
  };
}

export function liveStats(snapshot: TypingSnapshot, now: number) {
  const durationMs = snapshot.startedAt ? Math.max(0, now - snapshot.startedAt) : 0;
  const wpm = durationMs >= 800 ? computeWpm(snapshot.correct, durationMs) : 0;
  const accuracy = computeAccuracy(snapshot.correct, snapshot.errors);
  return { durationMs, wpm, accuracy };
}

export function evaluateLesson(
  lesson: Lesson,
  snapshot: TypingSnapshot,
  durationMs: number,
): { passed: boolean; stars: number; wpm: number; accuracy: number } {
  const wpm = computeWpm(snapshot.correct, durationMs);
  const accuracy = computeAccuracy(snapshot.correct, snapshot.errors);
  const finished = snapshot.finished || snapshot.index >= snapshot.prompt.length;
  const accuracyOk = lesson.goals.accuracy <= 0 || accuracy >= lesson.goals.accuracy;
  const wpmOk = lesson.goals.wpm <= 0 || wpm >= lesson.goals.wpm;
  const passed =
    lesson.kind === "guide"
      ? finished
      : lesson.kind === "exam"
        ? finished && accuracyOk && wpmOk
        : finished && accuracyOk;
  const stars =
    lesson.kind === "guide"
      ? finished
        ? 3
        : 0
      : starsForAttempt(passed, accuracy, wpm, lesson.goals.accuracy, lesson.starWpm);
  return { passed, stars, wpm, accuracy };
}
