import { describe, expect, it } from "vitest";
import { applyKey, createSnapshot, evaluateLesson, isTypingKey } from "../lib/engine";
import { computeAccuracy, computeWpm, starsForAttempt } from "../lib/wpm";
import { getLesson } from "../data/curriculum";

describe("wpm", () => {
  it("counts five characters as one word", () => {
    expect(computeWpm(50, 60_000)).toBe(10);
    expect(computeWpm(100, 60_000)).toBe(20);
  });

  it("returns 0 for no elapsed time", () => {
    expect(computeWpm(40, 0)).toBe(0);
  });

  it("computes accuracy from correct vs misses", () => {
    expect(computeAccuracy(9, 1)).toBe(90);
    expect(computeAccuracy(0, 0)).toBe(100);
  });

  it("awards stars from accuracy and speed", () => {
    expect(starsForAttempt(false, 99, 80, 80, [12, 20])).toBe(0);
    expect(starsForAttempt(true, 85, 5, 80, [12, 20])).toBe(1);
    expect(starsForAttempt(true, 85, 12, 80, [12, 20])).toBe(2);
    expect(starsForAttempt(true, 96, 22, 80, [12, 20])).toBe(3);
  });
});

describe("engine", () => {
  it("ignores modifier keys", () => {
    expect(isTypingKey("Shift")).toBe(false);
    expect(isTypingKey("a")).toBe(true);
    expect(isTypingKey(" ")).toBe(true);
  });

  it("does not advance on a miss", () => {
    let snap = createSnapshot("ab");
    snap = applyKey(snap, "z", 1_000, true);
    expect(snap.index).toBe(0);
    expect(snap.errors).toBe(1);
    expect(snap.keyErrors.a).toBe(1);
    snap = applyKey(snap, "a", 1_100, true);
    expect(snap.index).toBe(1);
    expect(snap.correct).toBe(1);
  });

  it("accepts the other case in lenient lessons", () => {
    let snap = createSnapshot("f");
    snap = applyKey(snap, "F", 1, true);
    expect(snap.finished).toBe(true);
    snap = createSnapshot("F");
    snap = applyKey(snap, "f", 1, false);
    expect(snap.finished).toBe(false);
  });
});

describe("lessons", () => {
  it("requires summit exam speed and accuracy", () => {
    const exam = getLesson("summit-exam");
    if (!exam) throw new Error("missing exam");
    const snap = {
      ...createSnapshot("x"),
      finished: true,
      correct: 100,
      errors: 2,
    };
    const slow = evaluateLesson(exam, snap, 120_000);
    expect(slow.passed).toBe(false);
    const fast = evaluateLesson(exam, snap, 20_000);
    expect(fast.passed).toBe(true);
    expect(fast.stars).toBeGreaterThan(0);
  });

  it("lets early lessons pass on accuracy without a speed gate", () => {
    const lesson = getLesson("left-f");
    if (!lesson) throw new Error("missing lesson");
    const snap = {
      ...createSnapshot("x"),
      finished: true,
      correct: 20,
      errors: 4,
    };
    const result = evaluateLesson(lesson, snap, 60_000);
    expect(result.passed).toBe(true);
    expect(result.accuracy).toBe(computeAccuracy(20, 4));
  });
});
