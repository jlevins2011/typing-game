import { describe, expect, it } from "vitest";
import { LESSONS } from "../data/curriculum";
import { isLessonUnlocked, recommendedLessonId } from "./stats";
import { buildPrompt } from "./prompts";
import { createChild, hashPin } from "./storage";

describe("progress", () => {
  it("unlocks the first lesson and then the next after a star", () => {
    const child = createChild("Ada", "ember");
    expect(isLessonUnlocked(child, LESSONS[0].id)).toBe(true);
    expect(isLessonUnlocked(child, LESSONS[1].id)).toBe(false);
    child.completedLessons[LESSONS[0].id] = {
      stars: 1,
      bestWpm: 8,
      bestAccuracy: 90,
      attempts: 1,
      completedAt: 1,
    };
    expect(isLessonUnlocked(child, LESSONS[1].id)).toBe(true);
    expect(recommendedLessonId(child)).toBe(LESSONS[1].id);
  });

  it("does not unlock the next lesson after a zero-star attempt", () => {
    const child = createChild("Bea", "snow");
    child.completedLessons[LESSONS[1].id] = {
      stars: 0,
      bestWpm: 15,
      bestAccuracy: 57,
      attempts: 1,
      completedAt: 0,
    };
    expect(isLessonUnlocked(child, LESSONS[1].id)).toBe(false);
  });
});

describe("prompts", () => {
  it("is deterministic for a seed", () => {
    const lesson = LESSONS.find((item) => item.id === "left-home");
    if (!lesson) throw new Error("missing");
    expect(buildPrompt(lesson, "seed-1")).toBe(buildPrompt(lesson, "seed-1"));
    expect(buildPrompt(lesson, "seed-1")).not.toBe(buildPrompt(lesson, "seed-2"));
  });

  it("only uses the lesson's keys for home-row drills", () => {
    const lesson = LESSONS.find((item) => item.id === "left-home");
    if (!lesson) throw new Error("missing");
    const prompt = buildPrompt(lesson, "abc");
    expect([...prompt].every((ch) => "asdf ".includes(ch))).toBe(true);
  });
});

describe("pin", () => {
  it("hashes the same PIN the same way", () => {
    expect(hashPin("1234")).toBe(hashPin("1234"));
    expect(hashPin("1234")).not.toBe(hashPin("0000"));
  });
});
