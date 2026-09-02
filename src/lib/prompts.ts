import { SENTENCES, WORDS, wordsUsing, EXAM_PASSAGE } from "../data/words";
import type { Lesson } from "../types";

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

function drillChars(keys: string): string[] {
  return keys.split("").filter((ch) => ch !== " ");
}

export function generateDrill(keys: string, length: number, rng: () => number): string {
  const chars = drillChars(keys);
  const pool = chars.length ? chars : ["a"];
  const includeSpace = keys.includes(" ");
  const parts: string[] = [];
  let count = 0;
  while (count < length) {
    const group = 3 + Math.floor(rng() * 3);
    let chunk = "";
    for (let i = 0; i < group && count < length; i++) {
      chunk += pick(rng, pool);
      count++;
    }
    parts.push(chunk);
    if (includeSpace && count < length && rng() > 0.15) {
      parts.push(" ");
      count++;
    }
  }
  return parts.join("").replace(/\s+/g, " ").trim();
}

export function generateWords(keys: string, length: number, rng: () => number): string {
  const allowed = keys.replace(/[^a-z]/g, "");
  let pool = wordsUsing(allowed.length ? allowed : "asdfghjkl");
  if (pool.length < 4) {
    pool = WORDS.filter((w) => w.length <= 6);
  }
  const parts: string[] = [];
  let count = 0;
  while (count < length) {
    const word = pick(rng, pool);
    if (parts.length) {
      parts.push(" ");
      count++;
    }
    parts.push(word);
    count += word.length;
  }
  return parts.join("").trim();
}

export function generateSentences(length: number, rng: () => number, capitals: boolean): string {
  const parts: string[] = [];
  let count = 0;
  while (count < length) {
    let sentence = pick(rng, SENTENCES);
    if (!capitals) sentence = sentence.toLowerCase();
    if (parts.length) {
      parts.push(" ");
      count++;
    }
    parts.push(sentence);
    count += sentence.length;
  }
  return parts.join("").trim();
}

export function buildPrompt(lesson: Lesson, attemptSeed: string): string {
  if (lesson.kind === "guide") return "";
  if (lesson.id === "summit-exam") return EXAM_PASSAGE;
  const rng = mulberry32(hashSeed(`${lesson.id}:${attemptSeed}`));
  if (lesson.kind === "words" || lesson.kind === "adventure" || lesson.kind === "exam") {
    if (lesson.id === "home-words") return generateWords(lesson.keys, lesson.promptChars, rng);
    if (lesson.id === "capitals" || lesson.id === "punctuation" || lesson.id === "sentences" || lesson.id === "story-trail" || lesson.id === "endurance") {
      return generateSentences(lesson.promptChars, rng, lesson.id === "capitals" || lesson.id === "punctuation" || lesson.id === "story-trail" || lesson.id === "endurance");
    }
    if (lesson.keys.includes("a") && lesson.keys.includes("z")) {
      return generateWords("abcdefghijklmnopqrstuvwxyz ", lesson.promptChars, rng);
    }
    return generateWords(lesson.keys, lesson.promptChars, rng);
  }
  return generateDrill(lesson.keys, lesson.promptChars, rng);
}
