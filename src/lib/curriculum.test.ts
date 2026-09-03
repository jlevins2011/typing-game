import { describe, expect, it } from "vitest";
import { LESSONS, lessonsInWorld } from "../data/curriculum";
import { buildPrompt } from "./prompts";

describe("finger-by-finger curriculum", () => {
  it("parks both hands, then isolates each finger before combining a hand", () => {
    expect(lessonsInWorld("home-camp").map((lesson) => lesson.id)).toEqual([
      "home-rest",
      "home-park",
      "left-f",
      "left-d",
      "left-s",
      "left-a",
      "left-home",
      "right-j",
      "right-k",
      "right-l",
      "right-semi",
      "right-home",
      "thumbs-space",
      "home-row",
      "home-gh",
      "home-words",
      "home-trail",
    ]);
  });

  it("climbs the top row one finger at a time before mixing the row", () => {
    expect(lessonsInWorld("high-ridge").map((lesson) => lesson.id)).toEqual([
      "left-r",
      "left-e",
      "left-w",
      "left-q",
      "left-top",
      "right-u",
      "right-i",
      "right-o",
      "right-p",
      "right-top",
      "index-ty",
      "top-mix",
      "ridge-trail",
    ]);
  });

  it("drops to the bottom row one finger at a time before the alphabet", () => {
    expect(lessonsInWorld("riverbed").map((lesson) => lesson.id)).toEqual([
      "left-v",
      "left-c",
      "left-x",
      "left-z",
      "left-bottom",
      "right-m",
      "right-comma",
      "right-period",
      "right-bottom",
      "index-bn",
      "alphabet",
      "river-trail",
    ]);
  });

  it("keeps single-finger home drills on that finger’s key", () => {
    const lesson = LESSONS.find((item) => item.id === "left-d");
    if (!lesson) throw new Error("missing left-d");
    const prompt = buildPrompt(lesson, "seed-d");
    expect(prompt.length).toBeGreaterThan(10);
    expect([...prompt].every((ch) => ch === "d")).toBe(true);
  });
});
